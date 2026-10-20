import { Args } from '@oclif/core';

import { notFound } from '../../lib/errors.js';
import { num, text } from '../../lib/format.js';
import type { OffProduct } from '../../lib/types.js';
import { renderPortions } from '../../lib/portions.js';
import { OFF_PRODUCT } from '../../graphql/operations.js';
import { BaseCommand, usdaFlags } from '../../lib/base.js';
import { hasValidCheckDigit, isUkProduct, offProductName } from '../../lib/sources.js';

export default class OffShow extends BaseCommand {
    static description =
        'Show one Open Food Facts product by its barcode, with its macros and its portions. ' +
        'Compare the values with the label before linking it: volunteers enter the data.';

    static examples = [
        '<%= config.bin %> <%= command.id %> 5010338301255',
        '<%= config.bin %> <%= command.id %> 5010338301255 --json',
    ];

    static args = {
        barcode: Args.string({ description: 'The barcode digits', required: true }),
    };

    static flags = { ...usdaFlags };

    async run(): Promise<unknown> {
        const { args, flags } = await this.parse(OffShow);
        const barcode = args.barcode.trim();
        if (!hasValidCheckDigit(barcode)) {
            this.addWarning(`${barcode} fails the barcode check digit. Check for a misread digit.`);
        }
        const client = this.api(flags.url);
        const data = await client.cachedOffProduct(
            barcode,
            OFF_PRODUCT,
            { barcode },
            { refresh: flags.refresh }
        );
        const product = data.offProduct as unknown as OffProduct | null;
        if (!product) {
            throw notFound(`No Open Food Facts product with barcode ${barcode}.`);
        }
        for (const warning of product.warnings) {
            this.addWarning(warning);
        }
        const portions = product.portions ?? [];
        const lines = [
            `${offProductName(product)} (${product.barcode})  ·  Open Food Facts`,
            `Per 100 g: ${num(product.caloriesPer100g)} kcal · ${num(product.proteinPer100g)} g protein · ${num(product.carbsPer100g)} g carbs · ${num(product.fatPer100g)} g fat`,
            `Pack: ${text(product.quantity)}  ·  Serving: ${text(product.servingSize)}  ·  ` +
                `Sold in the UK: ${isUkProduct(product) ? 'yes' : 'not recorded'}`,
            '',
            renderPortions(portions),
        ];
        this.out(lines.join('\n'));
        return { ...product, portions, fromCache: client.cacheHit };
    }
}
