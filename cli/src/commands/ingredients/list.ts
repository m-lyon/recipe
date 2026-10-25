import { Flags } from '@oclif/core';

import { BaseCommand } from '../../lib/base.js';
import { renderTable } from '../../lib/format.js';
import { measuresByIngredient } from '../../lib/measures.js';
import { GET_NUTRITIONAL_INFOS } from '../../graphql/operations.js';
import { allIngredients, resolveRecipe } from '../../lib/resolve.js';
import { GET_INGREDIENT_MEASURES } from '../../graphql/operations.js';
import type { MeasureSummary, NutritionalInfoSummary } from '../../lib/types.js';
import { indexByIngredient, recipeIngredientIds, recordForPrep } from '../../lib/nutrition.js';

export default class IngredientsList extends BaseCommand {
    static description =
        'List ingredients and whether they have nutritional data. --missing-nutrition is the ' +
        'entry point for a bulk linking run.';

    static examples = [
        '<%= config.bin %> <%= command.id %> --missing-nutrition',
        '<%= config.bin %> <%= command.id %> --missing-nutrition --json',
        '<%= config.bin %> <%= command.id %> --recipe tomato-soup-a4f2k',
    ];

    static flags = {
        'missing-nutrition': Flags.boolean({
            description:
                'Only ingredients with no NutritionalInfo record, or with records for prep ' +
                'methods only',
            default: false,
        }),
        recipe: Flags.string({
            description: 'Restrict to the ingredients used by one recipe',
            helpValue: 'IDENTIFIER',
        }),
        limit: Flags.integer({ description: 'Rows to return', default: 25 }),
        offset: Flags.integer({ description: 'Rows to skip', default: 0 }),
    };

    async run(): Promise<unknown> {
        const { flags } = await this.parse(IngredientsList);
        const client = this.api(flags.url);

        let ingredients = await allIngredients(client);
        if (flags.recipe) {
            const recipe = await resolveRecipe(client, flags.recipe);
            const used = new Set(recipeIngredientIds(recipe));
            ingredients = ingredients.filter((ingredient) => used.has(ingredient._id));
        }

        // There is no server-side filter for "has no nutritional data", so the
        // records are fetched in one request and diffed here.
        const infos =
            ingredients.length === 0
                ? []
                : ((
                      await client.request(GET_NUTRITIONAL_INFOS, {
                          ingredientIds: ingredients.map((ingredient) => ingredient._id),
                      })
                  ).nutritionalInfosByIngredientIds as unknown as NutritionalInfoSummary[]);
        const byIngredient = indexByIngredient(infos.filter(Boolean));
        const measures =
            ingredients.length === 0
                ? []
                : (((
                      await client.request(GET_INGREDIENT_MEASURES, {
                          ingredientIds: ingredients.map((ingredient) => ingredient._id),
                      })
                  ).ingredientMeasuresByIngredientIds ?? []) as unknown as MeasureSummary[]);
        const measuresOf = measuresByIngredient(measures);

        const all = ingredients.map((ingredient) => {
            const records = byIngredient.get(ingredient._id) ?? [];
            // The plain record describes the ingredient; prep records are listed by name.
            const plain = recordForPrep(records, null);
            const info = plain ?? records[0];
            return {
                _id: ingredient._id,
                name: ingredient.name,
                pluralName: ingredient.pluralName,
                isCountable: ingredient.isCountable,
                // Prep only: lines with no prep method, or another one, are not counted.
                nutrition: plain ? 'linked' : info ? 'prep only' : 'missing',
                source: info?.source ?? null,
                usdaFdcId: info?.usdaFdcId ?? null,
                openFoodFactsBarcode: info?.openFoodFactsBarcode ?? null,
                hasPerGram: Boolean(info?.perGram),
                prepMethods: records.flatMap((record) =>
                    record.prepMethod ? [record.prepMethod.value] : []
                ),
                measures: measuresOf.get(ingredient._id)?.length ?? 0,
            };
        });
        const filtered = flags['missing-nutrition']
            ? all.filter((ingredient) => ingredient.nutrition !== 'linked')
            : all;
        const page = filtered.slice(flags.offset, flags.offset + flags.limit);

        this.out(
            renderTable(
                ['ID', 'NAME', 'COUNTABLE', 'MEASURES', 'NUTRITION'],
                page.map((ingredient) => [
                    ingredient._id,
                    ingredient.name,
                    ingredient.isCountable ? 'yes' : 'no',
                    String(ingredient.measures),
                    ingredient.prepMethods.length > 0
                        ? `${ingredient.nutrition} (+${ingredient.prepMethods.join(', ')})`
                        : ingredient.nutrition,
                ])
            )
        );
        return {
            total: filtered.length,
            offset: flags.offset,
            limit: flags.limit,
            ingredients: page,
        };
    }
}
