import { Flags } from '@oclif/core';

import { BaseCommand } from '../../lib/base.js';
import { EMPTY, num, renderTable } from '../../lib/format.js';
import type { NutritionalInfoSummary } from '../../lib/types.js';
import { GET_NUTRITIONAL_INFOS } from '../../graphql/operations.js';
import { allIngredients, resolveRecipe } from '../../lib/resolve.js';
import { indexByIngredient, recipeIngredientIds } from '../../lib/nutrition.js';

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
            description: 'Only ingredients with no NutritionalInfo record',
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

        const all = ingredients.map((ingredient) => {
            const info = byIngredient.get(ingredient._id);
            return {
                _id: ingredient._id,
                name: ingredient.name,
                pluralName: ingredient.pluralName,
                isCountable: ingredient.isCountable,
                density: ingredient.density ?? null,
                nutrition: info ? 'linked' : 'missing',
                usdaFdcId: info?.usdaFdcId ?? null,
                hasPerGram: Boolean(info?.perGram),
                hasPerUnit: Boolean(info?.perUnit),
            };
        });
        const filtered = flags['missing-nutrition']
            ? all.filter((ingredient) => ingredient.nutrition === 'missing')
            : all;
        const page = filtered.slice(flags.offset, flags.offset + flags.limit);

        this.out(
            renderTable(
                ['ID', 'NAME', 'COUNTABLE', 'DENSITY', 'NUTRITION'],
                page.map((ingredient) => [
                    ingredient._id,
                    ingredient.name,
                    ingredient.isCountable ? 'yes' : 'no',
                    ingredient.density === null ? EMPTY : num(ingredient.density, 3),
                    ingredient.nutrition,
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
