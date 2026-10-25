import { Args, Flags } from '@oclif/core';

import { indent } from '../../lib/format.js';
import { notFound } from '../../lib/errors.js';
import { formatMacros } from '../../lib/macros.js';
import { describeSource } from '../../lib/sources.js';
import { recordForPrep } from '../../lib/nutrition.js';
import type { NamedSummary } from '../../lib/types.js';
import { resolvePrepMethod } from '../../lib/measures.js';
import { BaseCommand, writeFlags } from '../../lib/base.js';
import { ingredientNutrition, resolveIngredient } from '../../lib/resolve.js';
import { DELETE_NUTRITIONAL_INFO, GET_MEASURE_COMPONENTS } from '../../graphql/operations.js';

export default class NutritionUnlink extends BaseCommand {
    static description =
        "Remove an ingredient's NutritionalInfo: the record with no prep method, or with " +
        '--prep the record for that prep method. Its measures are left alone.';

    static examples = [
        '<%= config.bin %> <%= command.id %> "olive oil" --dry-run',
        '<%= config.bin %> <%= command.id %> "olive oil"',
        '<%= config.bin %> <%= command.id %> lime --prep juiced',
    ];

    static args = {
        ingredient: Args.string({ description: 'An exact name or a MongoID', required: true }),
    };

    static flags = {
        prep: Flags.string({
            description: 'Remove the record for this prep method, such as juiced',
        }),
        ...writeFlags,
    };

    async run(): Promise<unknown> {
        const { args, flags } = await this.parse(NutritionUnlink);
        const client = this.api(flags.url);
        const { ingredient } = await resolveIngredient(client, args.ingredient);

        const prep = flags.prep
            ? resolvePrepMethod(
                  ((await client.request(GET_MEASURE_COMPONENTS)).prepMethods ??
                      []) as unknown as NamedSummary[],
                  flags.prep
              )
            : null;
        const existing = recordForPrep(
            await ingredientNutrition(client, ingredient._id),
            prep?._id ?? null
        );
        if (!existing) {
            throw notFound(
                prep
                    ? `${ingredient.name} has no nutritional data for ${prep.value} to remove.`
                    : `${ingredient.name} has no nutritional data to remove.`
            );
        }

        const removed = [
            `prep        ${prep?.value ?? '(none)'}`,
            `source      ${describeSource(existing)}`,
            `perGram     ${formatMacros(existing.perGram)}`,
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
