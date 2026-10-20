import { Args } from '@oclif/core';

import { notFound } from '../../lib/errors.js';
import { num, text } from '../../lib/format.js';
import { renderPortions } from '../../lib/portions.js';
import { BaseCommand, usdaFlags } from '../../lib/base.js';
import type { OpenFoodFactsProduct } from '../../lib/types.js';
import { OPEN_FOOD_FACTS_PRODUCT } from '../../graphql/operations.js';
import { hasValidCheckDigit, isUkProduct, openFoodFactsProductName } from '../../lib/sources.js';

export default class OpenFoodFactsShow extends BaseCommand {
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
        const { args, flags } = await this.parse(OpenFoodFactsShow);
        const barcode = args.barcode.trim();
        if (!hasValidCheckDigit(barcode)) {
            this.addWarning(`${barcode} fails the barcode check digit. Check for a misread digit.`);
        }
        const client = this.api(flags.url);
        const data = await client.cachedOpenFoodFactsProduct(
            barcode,
            OPEN_FOOD_FACTS_PRODUCT,
            { barcode },
            { refresh: flags.refresh }
        );
        const product = data.openFoodFactsProduct as unknown as OpenFoodFactsProduct | null;
        if (!product) {
            throw notFound(`No Open Food Facts product with barcode ${barcode}.`);
        }
        for (const warning of product.warnings) {
            this.addWarning(warning);
        }
        const portions = product.portions ?? [];
        const lines = [
            `${openFoodFactsProductName(product)} (${product.barcode})  ·  Open Food Facts`,
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
