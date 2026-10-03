import { Args } from '@oclif/core';

import { notFound } from '../../lib/errors.js';
import { num, text } from '../../lib/format.js';
import type { UsdaFoodItem } from '../../lib/types.js';
import { BaseCommand, usdaFlags } from '../../lib/base.js';
import { USDA_FOOD_ITEM } from '../../graphql/operations.js';
import { itemPortions, renderPortions } from '../../lib/portions.js';

export default class UsdaShow extends BaseCommand {
    static description =
        'Show one USDA food item with its macros and its portions. This is the command to ' +
        'judge a candidate with before linking it.';

    static examples = [
        '<%= config.bin %> <%= command.id %> 171287',
        '<%= config.bin %> <%= command.id %> 171413 --json',
    ];

    static args = {
        fdcId: Args.integer({ description: 'The USDA FoodData Central id', required: true }),
    };

    static flags = { ...usdaFlags };

    async run(): Promise<unknown> {
        const { args, flags } = await this.parse(UsdaShow);
        const client = this.api(flags.url);
        const data = await client.cachedFoodItem(
            args.fdcId,
            USDA_FOOD_ITEM,
            { fdcId: args.fdcId },
            { refresh: flags.refresh }
        );
        const item = data.usdaFoodItem as unknown as UsdaFoodItem | null;
        if (!item) {
            throw notFound(`No USDA food item with fdcId ${args.fdcId}.`);
        }
        const portions = item.portions ?? [];
        const heading = [
            item.description,
            ` (${item.fdcId})`,
            item.dataType ? `  ·  ${item.dataType}` : '',
            item.brandOwner ? `  ·  ${item.brandOwner}` : '',
        ].join('');
        const lines: string[] = [
            heading,
            `Per 100 g: ${num(item.caloriesPer100g)} kcal · ${num(item.proteinPer100g)} g protein · ${num(item.carbsPer100g)} g carbs · ${num(item.fatPer100g)} g fat`,
        ];
        if (item.householdServingFullText) {
            lines.push(`Household serving: ${text(item.householdServingFullText)}`);
        }
        lines.push('', renderPortions(portions));
        this.out(lines.join('\n'));
        return {
            ...item,
            portions,
            itemPortionCount: itemPortions(portions).length,
            fromCache: client.usdaCacheHit,
        };
    }
}
