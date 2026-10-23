import path from 'path';
import { createHash } from 'crypto';

import { GraphQLError } from 'graphql';
import { schemaComposer } from 'graphql-compose';
import GraphQLUpload from 'graphql-upload/GraphQLUpload.mjs';

import { badInput } from './validation.js';
import { FileUpload } from '../utils/upload.js';
import { forgetOpenFoodFactsProduct, isBarcode } from './OpenFoodFacts.js';
import { OPEN_FOOD_FACTS_CONTACT, OPEN_FOOD_FACTS_WRITE } from '../constants.js';

const APP_NAME = 'recipe';
const APP_VERSION = '1.0';
const WRITE_TIMEOUT_MS = 30_000;
const PHOTO_EXTENSIONS = ['.jpg', '.jpeg', '.png'];
/** Staging asks for HTTP basic auth, so that search engines do not index it. */
const STAGING_BASIC_AUTH = `Basic ${Buffer.from('off:off').toString('base64')}`;

export interface OpenFoodFactsContribution {
    barcode: string;
    productName?: string | null;
    brands?: string | null;
    quantity?: string | null;
    per100g?: OpenFoodFactsNutrition | null;
    // For a liquid whose label gives values per 100 ml. Open Food Facts records them as a
    // per 100 ml nutrition set, as printed.
    per100ml?: OpenFoodFactsNutrition | null;
}

interface OpenFoodFactsNutrition {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
}

const OpenFoodFactsNutritionInputTC = schemaComposer.createInputTC({
    name: 'OpenFoodFactsNutritionInput',
    description: 'Values per 100 g or per 100 ml, as printed on the pack label',
    fields: {
        calories: 'Float!',
        protein: 'Float!',
        carbs: 'Float!',
        fat: 'Float!',
    },
});

const OpenFoodFactsContributionInputTC = schemaComposer.createInputTC({
    name: 'OpenFoodFactsContributionInput',
    fields: {
        barcode: 'String!',
        productName: 'String',
        brands: 'String',
        // The pack size as printed e.g. "4 x 26 g"
        quantity: 'String',
        per100g: OpenFoodFactsNutritionInputTC,
        // For a label that gives values per 100 ml. Not with per100g.
        per100ml: OpenFoodFactsNutritionInputTC,
    },
});

const OpenFoodFactsContributionResultTC = schemaComposer.createObjectTC({
    name: 'OpenFoodFactsContributionResult',
    fields: {
        barcode: 'String!',
        // The host written to, so a contribution to staging is never mistaken for one to
        // production.
        host: 'String!',
        // The product fields sent, such as "product_name" or "nutriment_fat".
        fieldsSent: '[String!]!',
        photoUploaded: 'Boolean!',
    },
});

/**
 * A stable ID for one of our users, from which Open Food Facts can neither read the user
 * nor link them to another app. Moderators use it to ban one user, not the whole app.
 */
export function appUuid(userId: string, salt: string): string {
    const hex = createHash('sha256').update(`${salt}:${userId}`).digest('hex');
    return [
        hex.slice(0, 8),
        hex.slice(8, 12),
        hex.slice(12, 16),
        hex.slice(16, 20),
        hex.slice(20, 32),
    ].join('-');
}

/** The form fields of a product edit, without the credentials. */
export function productFields(contribution: OpenFoodFactsContribution): Record<string, string> {
    const fields: Record<string, string> = {};
    if (contribution.productName?.trim()) fields.product_name = contribution.productName.trim();
    if (contribution.brands?.trim()) fields.brands = contribution.brands.trim();
    if (contribution.quantity?.trim()) fields.quantity = contribution.quantity.trim();
    const values = contribution.per100g ?? contribution.per100ml;
    if (values) {
        fields.nutrition_data_per = contribution.per100g ? '100g' : '100ml';
        const nutriments: Array<[string, number, string]> = [
            ['energy-kcal', values.calories, 'kcal'],
            ['proteins', values.protein, 'g'],
            ['carbohydrates', values.carbs, 'g'],
            ['fat', values.fat, 'g'],
        ];
        for (const [name, value, unit] of nutriments) {
            fields[`nutriment_${name}`] = String(value);
            fields[`nutriment_${name}_unit`] = unit;
        }
    }
    return fields;
}

function validate(contribution: OpenFoodFactsContribution, hasPhoto: boolean): void {
    if (!isBarcode(contribution.barcode)) {
        throw badInput('A barcode is 8 to 14 digits');
    }
    if (contribution.per100g && contribution.per100ml) {
        throw badInput('Send values per 100 g or per 100 ml, not both');
    }
    const values = contribution.per100g ?? contribution.per100ml;
    if (values && Object.values(values).some((value) => !(Number.isFinite(value) && value >= 0))) {
        throw badInput('Nutrition values must be numbers of 0 or more');
    }
    if (Object.keys(productFields(contribution)).length === 0 && !hasPhoto) {
        throw badInput(
            'A contribution needs a product field, values per 100 g or 100 ml, or a photo'
        );
    }
}

function headers(url: string): Record<string, string> {
    const result: Record<string, string> = {
        'User-Agent': `${APP_NAME}/${APP_VERSION} (${OPEN_FOOD_FACTS_CONTACT})`,
    };
    if (new URL(url).hostname.endsWith('openfoodfacts.net')) {
        result.Authorization = STAGING_BASIC_AUTH;
    }
    return result;
}

/** Sends a write and parses its JSON body. The body holds the password: never log it. */
async function send(url: string, init: RequestInit): Promise<Record<string, unknown>> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), WRITE_TIMEOUT_MS);
    try {
        const res = await fetch(url, { ...init, signal: controller.signal });
        if (!res.ok) {
            throw new GraphQLError(`Open Food Facts error: ${res.status} ${res.statusText}`);
        }
        return (await res.json()) as Record<string, unknown>;
    } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
            throw new GraphQLError(
                'The Open Food Facts service took too long to respond. The contribution may ' +
                    'or may not have been saved; check the product before you send it again.'
            );
        }
        throw err;
    } finally {
        clearTimeout(timer);
    }
}

async function readPhoto(photo: Promise<FileUpload>): Promise<string> {
    const { filename, createReadStream } = await photo;
    if (!PHOTO_EXTENSIONS.includes(path.extname(filename).toLowerCase())) {
        throw badInput('A label photo must be a .jpg, .jpeg or .png file');
    }
    const chunks: Buffer[] = [];
    for await (const chunk of createReadStream()) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    return Buffer.concat(chunks).toString('base64');
}

export const OpenFoodFactsMutation = {
    openFoodFactsContribute: schemaComposer.createResolver({
        name: 'openFoodFactsContribute',
        type: OpenFoodFactsContributionResultTC.NonNull,
        args: {
            input: OpenFoodFactsContributionInputTC.NonNull,
            // A photo of the nutrition label, so that others can check the values.
            labelPhoto: GraphQLUpload,
        },
        resolve: async ({ args, context }) => {
            const user = context.getUser();
            if (!user) {
                throw new GraphQLError('Not authenticated', {
                    extensions: { code: 'UNAUTHENTICATED' },
                });
            }
            const contribution = args.input as OpenFoodFactsContribution;
            contribution.barcode = contribution.barcode?.trim();
            const photo = args.labelPhoto as Promise<FileUpload> | undefined;
            validate(contribution, Boolean(photo));
            const { url, userId, password, appUuidSalt } = OPEN_FOOD_FACTS_WRITE;
            // Read before any write, so a bad photo cannot leave half a contribution.
            const photoBase64 = photo ? await readPhoto(photo) : null;

            const account = {
                user_id: userId,
                password,
                app_name: APP_NAME,
                app_version: APP_VERSION,
                app_uuid: appUuid(String(user._id), appUuidSalt),
            };
            const fields = productFields(contribution);
            if (Object.keys(fields).length > 0) {
                const json = await send(`${url}/cgi/product_jqm2.pl`, {
                    method: 'POST',
                    headers: headers(url),
                    body: new URLSearchParams({
                        code: contribution.barcode,
                        ...fields,
                        comment: 'Values from the pack label, sent from the recipe app',
                        ...account,
                    }),
                });
                if (json['status'] !== 1) {
                    throw new GraphQLError(
                        `Open Food Facts did not save the product: ${String(json['status_verbose'] ?? 'no reason given')}`
                    );
                }
                // Forget it now, in case the photo upload below fails.
                forgetOpenFoodFactsProduct(contribution.barcode);
            }
            if (photoBase64) {
                const json = await send(`${url}/api/v3/product/${contribution.barcode}/images`, {
                    method: 'POST',
                    headers: { ...headers(url), 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        image_data_base64: photoBase64,
                        // Select it as the English nutrition photo.
                        selected: { nutrition: { en: {} } },
                        ...account,
                    }),
                });
                if (!String(json['status'] ?? '').startsWith('success')) {
                    const saved = Object.keys(fields).length > 0;
                    throw new GraphQLError(
                        `Open Food Facts ${saved ? 'saved the product fields but not' : 'did not save'} ` +
                            `the photo: ${JSON.stringify(json['errors'] ?? json['status'] ?? 'no reason given')}`
                    );
                }
            }
            forgetOpenFoodFactsProduct(contribution.barcode);
            return {
                barcode: contribution.barcode,
                host: new URL(url).host,
                fieldsSent: Object.keys(fields),
                photoUploaded: Boolean(photoBase64),
            };
        },
    }),
};
