import { Args } from '@oclif/core';

import { notFound } from '../../lib/errors.js';
import { formatMacros } from '../../lib/macros.js';
import { EMPTY, indent } from '../../lib/format.js';
import { resolveIngredient } from '../../lib/resolve.js';
import { BaseCommand, writeFlags } from '../../lib/base.js';
import type { NutritionalInfoSummary } from '../../lib/types.js';
import { DELETE_NUTRITIONAL_INFO, GET_NUTRITIONAL_INFO } from '../../graphql/operations.js';

export default class NutritionUnlink extends BaseCommand {
    static description =
        "Remove an ingredient's NutritionalInfo. Ingredient.density is left alone.";

    static examples = [
        '<%= config.bin %> <%= command.id %> "olive oil" --dry-run',
        '<%= config.bin %> <%= command.id %> "olive oil"',
    ];

    static args = {
        ingredient: Args.string({ description: 'An exact name or a MongoID', required: true }),
    };

    static flags = { ...writeFlags };

    async run(): Promise<unknown> {
        const { args, flags } = await this.parse(NutritionUnlink);
        const client = this.api(flags.url);
        const { ingredient } = await resolveIngredient(client, args.ingredient);

        const existing = (
            await client.request(GET_NUTRITIONAL_INFO, {
                ingredientId: ingredient._id,
            })
        ).nutritionalInfoByIngredient as unknown as NutritionalInfoSummary | null;
        if (!existing) {
            throw notFound(`${ingredient.name} has no nutritional data to remove.`);
        }

        const removed = [
            `usdaFdcId   ${existing.usdaFdcId ?? EMPTY}`,
            `perGram     ${formatMacros(existing.perGram)}`,
            `perUnit     ${formatMacros(existing.perUnit)}`,
        ].join('\n');

        if (flags['dry-run']) {
            this.out(
                [
                    'DRY RUN — nothing was sent.',
                    '',
                    `Would remove NutritionalInfo ${existing._id} from ${ingredient.name}:`,
                    indent(removed),
                ].join('\n')
            );
            return { dryRun: true, ingredient, removed: existing };
        }

        await client.request(DELETE_NUTRITIONAL_INFO, { id: existing._id });
        this.out(
            [
                `Removed NutritionalInfo ${existing._id} from ${ingredient.name}:`,
                indent(removed),
            ].join('\n')
        );
        return { dryRun: false, ingredient, removed: existing };
    }
}
