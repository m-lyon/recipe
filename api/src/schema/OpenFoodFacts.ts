import { GraphQLError } from 'graphql';
import { schemaComposer } from 'graphql-compose';

import { OPEN_FOOD_FACTS_SEARCH_URL } from '../constants.js';
import { MappedPortion, UsdaFoodPortionTC, buildPortion } from './Usda.js';
import { OPEN_FOOD_FACTS_API_URL, OPEN_FOOD_FACTS_CONTACT } from '../constants.js';

const OPEN_FOOD_FACTS_REQUEST_TIMEOUT_MS = 10_000;
const OPEN_FOOD_FACTS_MAX_PAGE_SIZE = 50;
const OPEN_FOOD_FACTS_UK_TAG = 'en:united-kingdom';

/** The product fields the resolvers map. Asking for fewer keeps responses small. */
const PRODUCT_FIELDS = [
    'code',
    'product_name',
    'brands',
    'quantity',
    'serving_size',
    'serving_quantity',
    'serving_quantity_unit',
    'countries_tags',
    'nutriments',
].join(',');

/**
 * Open Food Facts limits reads per IP address: 15 product reads and 10 searches per
 * minute. Every user's request leaves from this server's one address, and going over the
 * limit can get the address banned, so the server holds itself below both.
 */
export const OPEN_FOOD_FACTS_PRODUCT_PER_MINUTE = 12;
export const OPEN_FOOD_FACTS_SEARCH_PER_MINUTE = 8;
const MINUTE_MS = 60_000;

/** A product rarely changes, so a found product is kept for a day. */
const PRODUCT_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const SEARCH_CACHE_TTL_MS = 60 * 60 * 1000;
const CACHE_MAX_ENTRIES = 500;

/** kcal from macros with the Atwater factors, and the gap from the label that is allowed
 *  before a warning. EU labels count fibre at 2 kcal and leave it out of carbs, so a
 *  small gap is normal. */
const KCAL_TOLERANCE_ABSOLUTE = 20;
const KCAL_TOLERANCE_RELATIVE = 0.2;

export interface OpenFoodFactsProduct {
    barcode: string;
    name: string | null;
    brands: string | null;
    quantity: string | null;
    servingSize: string | null;
    countries: string[];
    caloriesPer100g: number | null;
    proteinPer100g: number | null;
    carbsPer100g: number | null;
    fatPer100g: number | null;
    warnings: string[];
    portions: MappedPortion[];
}

const OpenFoodFactsProductTC = schemaComposer.createObjectTC({
    name: 'OpenFoodFactsProduct',
    fields: {
        barcode: 'String!',
        name: 'String',
        // Comma-separated, as Open Food Facts shows them: "Unilever, Knorr"
        brands: 'String',
        // The pack size as printed: "200g", "8×24 g"
        quantity: 'String',
        // The serving as printed: "0.25 tsp (1 g)"
        servingSize: 'String',
        // Country tags: "en:united-kingdom"
        countries: '[String!]!',
        caloriesPer100g: 'Float',
        proteinPer100g: 'Float',
        carbsPer100g: 'Float',
        fatPer100g: 'Float',
        // Data problems to show beside the product: a missing macro, or kcal that the
        // macros do not explain. The data is entered by volunteers.
        warnings: '[String!]!',
        portions: {
            type: UsdaFoodPortionTC.NonNull.List.NonNull,
            description: 'Portions from the serving size and from a multipack quantity',
        },
    },
});

function asNumber(value: unknown): number | null {
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function asString(value: unknown): string | null {
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

/** Search hits carry brands as a list; product reads carry a comma-separated string. */
function asBrands(value: unknown): string | null {
    if (Array.isArray(value)) {
        return asString(value.filter((brand) => typeof brand === 'string').join(', '));
    }
    return asString(value);
}

function macroWarnings(
    kcal: number | null,
    protein: number | null,
    carbs: number | null,
    fat: number | null
): string[] {
    const missing = Object.entries({ kcal, protein, carbs, fat })
        .filter(([, value]) => value == null)
        .map(([name]) => name);
    if (missing.length > 0) {
        return [`No value for ${missing.join(', ')}`];
    }
    const fromMacros = 4 * protein! + 4 * carbs! + 9 * fat!;
    const tolerance = Math.max(KCAL_TOLERANCE_ABSOLUTE, KCAL_TOLERANCE_RELATIVE * kcal!);
    if (Math.abs(kcal! - fromMacros) > tolerance) {
        return [`${kcal} kcal does not match the macros (about ${Math.round(fromMacros)} kcal)`];
    }
    return [];
}

/** Words that name a serving rather than one thing: "1 portion (5 g)". */
const SERVING_WORDS = /\b(portions?|servings?)\b/i;

/**
 * The serving as a portion: "0.25 tsp (1 g)" is a volume, "1 pot (28 g)" an item.
 *
 * Only `serving_quantity` in grams gives a weight. A serving with no household text
 * ("28g") is a plain weight, which perGram already prices.
 */
function servingPortion(product: Record<string, unknown>): MappedPortion | null {
    const text = asString(product['serving_size']);
    const grams = asNumber(product['serving_quantity']);
    const unit = asString(product['serving_quantity_unit']) ?? 'g';
    if (!text || grams == null || grams <= 0 || unit.toLowerCase() !== 'g') {
        return null;
    }
    const household = text.split('(')[0].trim();
    if (!household || household === text.trim()) {
        return null;
    }
    const portion = buildPortion(null, null, household, null, grams, false);
    if (SERVING_WORDS.test(household)) {
        return { ...portion, kind: 'SERVING', ambiguous: true };
    }
    // A serving is not always one item: Knorr pots weigh 24 g, but the serving is 28 g.
    return portion.kind === 'ITEM' ? { ...portion, ambiguous: true } : portion;
}

/** "8×24 g", "8 x 24g": the weight of one item in a multipack. */
const MULTIPACK = /^\s*(\d+)\s*[×x*]\s*(\d+(?:[.,]\d+)?)\s*g\s*$/i;

function multipackPortion(product: Record<string, unknown>): MappedPortion | null {
    const quantity = asString(product['quantity']);
    const match = quantity ? MULTIPACK.exec(quantity) : null;
    if (!match) return null;
    const grams = Number(match[2].replace(',', '.'));
    if (!(grams > 0)) return null;
    return buildPortion(1, null, `1 each (pack of ${quantity})`, null, grams, false);
}

export function mapProduct(product: Record<string, unknown>): OpenFoodFactsProduct {
    const nutriments = (product['nutriments'] as Record<string, unknown>) ?? {};
    const kcal = asNumber(nutriments['energy-kcal_100g']);
    const protein = asNumber(nutriments['proteins_100g']);
    const carbs = asNumber(nutriments['carbohydrates_100g']);
    const fat = asNumber(nutriments['fat_100g']);
    const countries = product['countries_tags'];
    return {
        barcode: String(product['code']),
        name: asString(product['product_name']),
        brands: asBrands(product['brands']),
        quantity: asString(product['quantity']),
        servingSize: asString(product['serving_size']),
        countries: Array.isArray(countries)
            ? countries.filter((tag): tag is string => typeof tag === 'string')
            : [],
        caloriesPer100g: kcal,
        proteinPer100g: protein,
        carbsPer100g: carbs,
        fatPer100g: fat,
        warnings: macroWarnings(kcal, protein, carbs, fat),
        portions: [servingPortion(product), multipackPortion(product)].filter(
            (portion): portion is MappedPortion => portion !== null
        ),
    };
}

/** GTIN-8, UPC-A, EAN-13 and GTIN-14 are all digits. The check digit is not enforced:
 *  Open Food Facts also holds store and internal codes that fail it. */
export function isBarcode(value: string): boolean {
    return /^\d{8,14}$/.test(value);
}

/** Least-recently-used cache with a time to live. A Map iterates in insertion order. */
class TtlCache<T> {
    private entries = new Map<string, { value: T; expires: number }>();

    constructor(private ttlMs: number) {}

    get(key: string): T | undefined {
        const entry = this.entries.get(key);
        if (!entry) return undefined;
        this.entries.delete(key);
        if (entry.expires < Date.now()) return undefined;
        this.entries.set(key, entry);
        return entry.value;
    }

    set(key: string, value: T): void {
        this.entries.delete(key);
        this.entries.set(key, { value, expires: Date.now() + this.ttlMs });
        if (this.entries.size > CACHE_MAX_ENTRIES) {
            this.entries.delete(this.entries.keys().next().value!);
        }
    }

    delete(key: string): void {
        this.entries.delete(key);
    }

    clear(): void {
        this.entries.clear();
    }
}

const productCache = new TtlCache<OpenFoodFactsProduct>(PRODUCT_CACHE_TTL_MS);
const searchCache = new TtlCache<OpenFoodFactsProduct[]>(SEARCH_CACHE_TTL_MS);
const sent: Record<'product' | 'search', number[]> = { product: [], search: [] };

/** Records an upstream request, or refuses it when the server-wide minute is spent. */
function spendUpstream(kind: 'product' | 'search', limit: number): void {
    const now = Date.now();
    const recent = sent[kind].filter((time) => now - time < MINUTE_MS);
    if (recent.length >= limit) {
        const retryAfterMs = MINUTE_MS - (now - recent[0]);
        throw new GraphQLError(
            `Open Food Facts is busy. Try again in ${Math.ceil(retryAfterMs / 1000)} seconds.`,
            { extensions: { code: 'RATE_LIMITED', retryAfterMs } }
        );
    }
    recent.push(now);
    sent[kind] = recent;
}

/**
 * Fetch an Open Food Facts endpoint and parse its JSON body.
 *
 * As in usdaFetchJson, the abort timer covers the body read too. A 404 is returned to
 * the caller, which reads it as "not found".
 */
async function openFoodFactsFetchJson(
    url: string
): Promise<{ status: number; json: Record<string, unknown> }> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), OPEN_FOOD_FACTS_REQUEST_TIMEOUT_MS);
    try {
        const res = await fetch(url, {
            // Open Food Facts asks every client to name itself and give a contact.
            headers: { 'User-Agent': `recipe/1.0 (${OPEN_FOOD_FACTS_CONTACT})` },
            signal: controller.signal,
        });
        if (!res.ok && res.status !== 404) {
            throw new GraphQLError(`Open Food Facts error: ${res.status} ${res.statusText}`);
        }
        return { status: res.status, json: (await res.json()) as Record<string, unknown> };
    } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
            throw new GraphQLError(
                'The Open Food Facts service took too long to respond. Try again.'
            );
        }
        throw err;
    } finally {
        clearTimeout(timer);
    }
}

function requireUser(context: { getUser: () => unknown }): void {
    if (!context.getUser()) {
        throw new GraphQLError('Not authenticated', {
            extensions: { code: 'UNAUTHENTICATED' },
        });
    }
}

export const OpenFoodFactsQuery = {
    openFoodFactsProduct: schemaComposer.createResolver({
        name: 'openFoodFactsProduct',
        type: OpenFoodFactsProductTC,
        args: { barcode: 'String!' },
        resolve: async ({ args, context }) => {
            requireUser(context);
            const barcode = typeof args.barcode === 'string' ? args.barcode.trim() : '';
            if (!isBarcode(barcode)) {
                throw new GraphQLError('A barcode is 8 to 14 digits', {
                    extensions: { code: 'BAD_USER_INPUT' },
                });
            }
            const cached = productCache.get(barcode);
            if (cached) return cached;

            spendUpstream('product', OPEN_FOOD_FACTS_PRODUCT_PER_MINUTE);
            const url = `${OPEN_FOOD_FACTS_API_URL}/api/v3/product/${barcode}?fields=${PRODUCT_FIELDS}`;
            const { status, json } = await openFoodFactsFetchJson(url);
            const product = json['product'] as Record<string, unknown> | undefined;
            if (status === 404 || !product) {
                throw new GraphQLError(`No Open Food Facts product with barcode ${barcode}`, {
                    extensions: { code: 'NOT_FOUND' },
                });
            }
            const mapped = mapProduct(product);
            productCache.set(barcode, mapped);
            return mapped;
        },
    }),
    openFoodFactsSearch: schemaComposer.createResolver({
        name: 'openFoodFactsSearch',
        type: OpenFoodFactsProductTC.NonNull.List.NonNull,
        args: {
            query: 'String!',
            pageSize: { type: 'Int', defaultValue: 20 },
            // Most products in this app are bought in the UK.
            ukOnly: { type: 'Boolean', defaultValue: true },
        },
        resolve: async ({ args, context }) => {
            requireUser(context);
            const query = typeof args.query === 'string' ? args.query.trim() : '';
            if (!query) {
                throw new GraphQLError('Invalid query argument', {
                    extensions: { code: 'BAD_USER_INPUT' },
                });
            }
            const pageSize = Math.min(
                Math.max((args.pageSize as number) ?? 20, 1),
                OPEN_FOOD_FACTS_MAX_PAGE_SIZE
            );
            const ukOnly = args.ukOnly !== false;
            const key = JSON.stringify([query.toLowerCase(), pageSize, ukOnly]);
            const cached = searchCache.get(key);
            if (cached) return cached;

            spendUpstream('search', OPEN_FOOD_FACTS_SEARCH_PER_MINUTE);
            const params = new URLSearchParams({
                // The search service takes a Lucene query; a quoted tag filters by country.
                q: ukOnly ? `${query} countries_tags:"${OPEN_FOOD_FACTS_UK_TAG}"` : query,
                page_size: String(pageSize),
                fields: PRODUCT_FIELDS,
            });
            const { json } = await openFoodFactsFetchJson(
                `${OPEN_FOOD_FACTS_SEARCH_URL}/search?${params}`
            );
            const hits = (json['hits'] as Array<Record<string, unknown>>) ?? [];
            const mapped = hits.filter((hit) => hit['code']).map(mapProduct);
            searchCache.set(key, mapped);
            return mapped;
        },
    }),
};

/** Drops a product from the cache, so the next read fetches what was just written. */
export function forgetOpenFoodFactsProduct(barcode: string): void {
    productCache.delete(barcode);
}

/** Test hook: empties the caches and the server-wide request windows. */
export function resetOpenFoodFacts(): void {
    productCache.clear();
    searchCache.clear();
    sent.product = [];
    sent.search = [];
}
