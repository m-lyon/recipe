import { extname } from 'node:path';
import { readFileSync, statSync } from 'node:fs';

import { Args, Flags } from '@oclif/core';

import { indent, text } from '../../lib/format.js';
import { CliError, rejected } from '../../lib/errors.js';
import type { UploadFile } from '../../graphql/client.js';
import { BaseCommand, writeFlags } from '../../lib/base.js';
import { kcalMismatch, parseLabelPer100g } from '../../lib/macros.js';
import type { OpenFoodFactsProduct, Per100g } from '../../lib/types.js';
import { hasValidCheckDigit, openFoodFactsProductName } from '../../lib/sources.js';
import { OPEN_FOOD_FACTS_CONTRIBUTE, OPEN_FOOD_FACTS_PRODUCT } from '../../graphql/operations.js';

/** The server's upload limit. */
const MAX_PHOTO_BYTES = 10_000_000;
const PHOTO_TYPES: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
};

interface Change {
    field: string;
    current: string;
    sent: string;
}

const MACROS: Array<[string, keyof Per100g]> = [
    ['kcal', 'caloriesPer100g'],
    ['protein', 'proteinPer100g'],
    ['carbs', 'carbsPer100g'],
    ['fat', 'fatPer100g'],
];

export default class OpenFoodFactsContribute extends BaseCommand {
    static description =
        'Send a missing product, or a correction, to Open Food Facts: the name, brands, pack ' +
        'size and values per 100 g from the pack label, with a photo of the label. This ' +
        'writes to a public database. The server sends it to staging unless production is ' +
        'configured.';

    static examples = [
        '<%= config.bin %> <%= command.id %> 8721317714801 --label-per-100g 69,3.8,12,0.5 ' +
            '--photo label.jpg --dry-run',
        '<%= config.bin %> <%= command.id %> 5016084000374 --label-per-100g 349,47,19,5 ' +
            '--photo label.jpg',
    ];

    static args = {
        barcode: Args.string({ description: 'The barcode digits', required: true }),
    };

    static flags = {
        'label-per-100g': Flags.string({
            description: 'Values per 100 g from the pack label',
            helpValue: 'KCAL,PROTEIN,CARBS,FAT',
        }),
        name: Flags.string({ description: 'The product name, as on the pack' }),
        brands: Flags.string({ description: 'The brands, comma-separated' }),
        quantity: Flags.string({ description: 'The pack size, as printed: "4 x 26 g"' }),
        photo: Flags.string({
            description: 'A photo of the nutrition label (.jpg or .png), so others can check it',
            helpValue: 'PATH',
        }),
        ...writeFlags,
    };

    async run(): Promise<unknown> {
        const { args, flags } = await this.parse(OpenFoodFactsContribute);
        const barcode = args.barcode.trim();

        // Everything a typo can break is checked before any request.
        const label = flags['label-per-100g'] ? parseLabelPer100g(flags['label-per-100g']) : null;
        if (flags['label-per-100g'] && !label) {
            throw rejected(
                `--label-per-100g takes four numbers, "kcal,protein,carbs,fat", not ` +
                    `"${flags['label-per-100g']}".`
            );
        }
        const photo = flags.photo ? readPhoto(flags.photo) : null;
        const input = {
            barcode,
            productName: flags.name?.trim() || null,
            brands: flags.brands?.trim() || null,
            quantity: flags.quantity?.trim() || null,
            per100g: label && {
                calories: label.caloriesPer100g!,
                protein: label.proteinPer100g!,
                carbs: label.carbsPer100g!,
                fat: label.fatPer100g!,
            },
        };
        if (!input.productName && !input.brands && !input.quantity && !label && !photo) {
            throw rejected(
                'Nothing to send. Pass --label-per-100g, --name, --brands, --quantity or --photo.'
            );
        }
        if (!/^\d{8,14}$/.test(barcode)) {
            throw rejected(`"${barcode}" is not a barcode: a barcode is 8 to 14 digits.`);
        }
        if (!hasValidCheckDigit(barcode)) {
            this.addWarning(`${barcode} fails the barcode check digit. Check for a misread digit.`);
        }
        const mismatch = label ? kcalMismatch(label) : null;
        if (mismatch) {
            this.addWarning(`Label values: ${mismatch}. Check the order of the values.`);
        }

        // The record as it is now, so the plan shows what changes. Fetched fresh: a cached
        // copy may predate an earlier contribution.
        const client = this.api(flags.url);
        const current = await this.currentProduct(barcode);
        if (!current && !input.productName) {
            this.addWarning(
                `${barcode} is not on Open Food Facts, so this adds a new product. Pass --name ` +
                    'so that others can find it.'
            );
        }
        const changes = describeChanges(current, input, label);
        const plan = {
            dryRun: flags['dry-run'],
            barcode,
            product: current ? openFoodFactsProductName(current) : null,
            isNew: !current,
            changes,
            photo: photo && { filename: photo.filename, bytes: photo.data.length },
        };

        if (flags['dry-run']) {
            this.out(render(plan, 'DRY RUN — nothing was sent.'));
            return plan;
        }

        let result;
        try {
            result = (
                await client.request(
                    OPEN_FOOD_FACTS_CONTRIBUTE,
                    { input, labelPhoto: null },
                    { files: photo ? { labelPhoto: photo } : undefined }
                )
            ).openFoodFactsContribute;
        } finally {
            // The next read must fetch what was just written, even after a partial failure.
            client.forgetOpenFoodFactsProduct(barcode);
        }
        const staging = result.host.endsWith('openfoodfacts.net');
        if (staging) {
            this.addWarning(
                `This went to the staging server (${result.host}), not to the public database.`
            );
        }
        this.out(
            render(
                plan,
                `Sent to ${result.host}${result.photoUploaded ? ', with the label photo' : ''}.`
            )
        );
        return { ...plan, result };
    }

    private async currentProduct(barcode: string): Promise<OpenFoodFactsProduct | null> {
        try {
            return (
                await this.api().cachedOpenFoodFactsProduct(
                    barcode,
                    OPEN_FOOD_FACTS_PRODUCT,
                    { barcode },
                    { refresh: true }
                )
            ).openFoodFactsProduct as unknown as OpenFoodFactsProduct | null;
        } catch (error) {
            if (error instanceof CliError && error.errorCode === 'NOT_FOUND') return null;
            throw error;
        }
    }
}

function readPhoto(path: string): UploadFile {
    const type = PHOTO_TYPES[extname(path).toLowerCase()];
    if (!type) {
        throw rejected(`A label photo must be a .jpg, .jpeg or .png file, not "${path}".`);
    }
    let size: number;
    try {
        size = statSync(path).size;
    } catch {
        throw rejected(`Cannot read the photo "${path}".`);
    }
    if (size > MAX_PHOTO_BYTES) {
        throw rejected(`The photo is ${size} bytes. The server takes at most ${MAX_PHOTO_BYTES}.`);
    }
    return {
        filename: path.split(/[\\/]/).pop()!,
        contentType: type,
        data: readFileSync(path),
    };
}

function describeChanges(
    current: OpenFoodFactsProduct | null,
    input: { productName: string | null; brands: string | null; quantity: string | null },
    label: Per100g | null
): Change[] {
    const changes: Change[] = [];
    const add = (field: string, now: string | null | undefined, sent: string | null) => {
        if (sent !== null) changes.push({ field, current: text(now), sent });
    };
    add('name', current?.name, input.productName);
    add('brands', current?.brands, input.brands);
    add('pack', current?.quantity, input.quantity);
    if (label) {
        for (const [name, key] of MACROS) {
            // Unrounded, so the plan shows exactly what is sent.
            add(name, current?.[key]?.toString(), String(label[key]));
        }
    }
    return changes;
}

function render(
    plan: {
        barcode: string;
        product: string | null;
        isNew: boolean;
        changes: Change[];
        photo: { filename: string; bytes: number } | null;
    },
    heading: string
): string {
    const rows = plan.changes.map((change) => {
        const differs = change.current !== change.sent ? '   ← changes' : '';
        return indent(
            `${change.field.padEnd(8)}  ${change.current.padEnd(24).slice(0, 24)}  ${change.sent}${differs}`
        );
    });
    return [
        heading,
        '',
        `Product   ${plan.isNew ? '(not on Open Food Facts: a new product)' : plan.product} (${plan.barcode})`,
        '',
        indent(`${'FIELD'.padEnd(8)}  ${'NOW'.padEnd(24)}  SENT`),
        ...rows,
        '',
        plan.photo
            ? `Label photo: ${plan.photo.filename} (${plan.photo.bytes} bytes), as the nutrition photo`
            : 'No label photo. One is recommended: others check the values against it.',
    ].join('\n');
}
