import { Flags } from '@oclif/core';

import { percent } from '../../lib/format.js';
import { BaseCommand } from '../../lib/base.js';
import { measuresByIngredient } from '../../lib/measures.js';
import { GET_RECIPES_BY_IDS } from '../../graphql/operations.js';
import { allIngredients, resolveRecipe } from '../../lib/resolve.js';
import { GET_INGREDIENT_MEASURES } from '../../graphql/operations.js';
import type { RecipeDetail, RecipeSummary } from '../../lib/types.js';
import type { MeasureSummary, NutritionalInfoSummary } from '../../lib/types.js';
import { GET_ALL_RECIPES, GET_NUTRITIONAL_INFOS } from '../../graphql/operations.js';
import { indexByIngredient, nutritionStatus, recipeIngredientIds } from '../../lib/nutrition.js';

export default class NutritionStatus extends BaseCommand {
    static description =
        'A coverage report over every recipe row, or over the rows of one recipe. A row counts ' +
        'as calculable by the same rule "recipes show" uses.';

    static examples = [
        '<%= config.bin %> <%= command.id %>',
        '<%= config.bin %> <%= command.id %> --recipe tomato-soup-a4f2k --json',
    ];

    static flags = {
        recipe: Flags.string({
            description: 'Report on one recipe instead of the whole database',
            helpValue: 'IDENTIFIER',
        }),
    };

    async run(): Promise<unknown> {
        const { flags } = await this.parse(NutritionStatus);
        const client = this.api(flags.url);

        let ingredients = await allIngredients(client);
        let recipes: RecipeDetail[];
        if (flags.recipe) {
            const recipe = await resolveRecipe(client, flags.recipe);
            recipes = [recipe];
        } else {
            const summaries = ((await client.request(GET_ALL_RECIPES)).recipeMany ??
                []) as unknown as RecipeSummary[];
            recipes =
                summaries.length === 0
                    ? []
                    : (((
                          await client.request(GET_RECIPES_BY_IDS, {
                              ids: summaries.map((recipe) => recipe._id),
                          })
                      ).recipeByIds ?? []) as unknown as RecipeDetail[]);
        }
        const used = new Set(recipes.flatMap((recipe) => recipeIngredientIds(recipe)));
        if (flags.recipe) {
            ingredients = ingredients.filter((ingredient) => used.has(ingredient._id));
        }

        const ids = ingredients.map((ingredient) => ingredient._id);
        const infos =
            ids.length === 0
                ? []
                : ((await client.request(GET_NUTRITIONAL_INFOS, { ingredientIds: ids }))
                      .nutritionalInfosByIngredientIds as unknown as NutritionalInfoSummary[]);
        const measures =
            ids.length === 0
                ? []
                : (((await client.request(GET_INGREDIENT_MEASURES, { ingredientIds: ids }))
                      .ingredientMeasuresByIngredientIds ?? []) as unknown as MeasureSummary[]);
        const byIngredient = indexByIngredient(infos.filter(Boolean));
        const measuresOf = measuresByIngredient(measures);

        const rows = { total: 0, linked: 0, partial: 0, missing: 0 };
        const missingWeights = new Map<
            string,
            { ingredient: string; weight: string; rows: number }
        >();
        for (const recipe of recipes) {
            for (const subsection of recipe.ingredientSubsections) {
                for (const entry of subsection.ingredients) {
                    if (entry.ingredient.__typename !== 'Ingredient') continue;
                    const id = entry.ingredient._id;
                    const status = nutritionStatus(
                        entry,
                        byIngredient.get(id),
                        measuresOf.get(id) ?? []
                    );
                    rows.total++;
                    if (status.state === 'linked') rows.linked++;
                    else if (status.state === 'partial') rows.partial++;
                    else if (status.state === 'missing') rows.missing++;
                    if (status.missingWeight) {
                        const gap = missingWeights.get(status.missingWeight) ?? {
                            ingredient: id,
                            weight: status.missingWeight,
                            rows: 0,
                        };
                        gap.rows++;
                        missingWeights.set(status.missingWeight, gap);
                    }
                }
            }
        }
        const linkedIngredients = ingredients.filter((ingredient) =>
            byIngredient.has(ingredient._id)
        );
        const gaps = [...missingWeights.values()].sort((a, b) => b.rows - a.rows);

        this.out(
            [
                `Recipe rows        ${rows.total}`,
                `  calculable       ${rows.linked}   (${percent(rows.linked, rows.total)})`,
                `  partial          ${rows.partial}`,
                `  missing          ${rows.missing}`,
                `Ingredients        ${ingredients.length}`,
                `  linked           ${linkedIngredients.length}   (${percent(linkedIngredients.length, ingredients.length)})`,
                `  missing          ${ingredients.length - linkedIngredients.length}`,
                `Missing weights    ${gaps.length}`,
                ...gaps
                    .slice(0, 10)
                    .map(
                        (gap) => `  ${gap.weight}   (${gap.rows} row${gap.rows === 1 ? '' : 's'})`
                    ),
            ].join('\n')
        );
        return {
            recipe: flags.recipe ?? null,
            rows,
            ingredients: {
                total: ingredients.length,
                linked: linkedIngredients.length,
                missing: ingredients.length - linkedIngredients.length,
            },
            gaps: {
                missing: ingredients
                    .filter((ingredient) => !byIngredient.has(ingredient._id))
                    .map((ingredient) => ({ _id: ingredient._id, name: ingredient.name })),
                missingWeights: gaps,
            },
        };
    }
}
