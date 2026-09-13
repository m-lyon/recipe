import { Flags } from '@oclif/core';

import { percent } from '../../lib/format.js';
import { BaseCommand } from '../../lib/base.js';
import { GET_RECIPES_BY_IDS } from '../../graphql/operations.js';
import { allIngredients, resolveRecipe } from '../../lib/resolve.js';
import type { RecipeDetail, RecipeSummary } from '../../lib/types.js';
import { indexByIngredient, recipeIngredientIds } from '../../lib/nutrition.js';
import type { IngredientSummary, NutritionalInfoSummary } from '../../lib/types.js';
import { GET_ALL_RECIPES, GET_NUTRITIONAL_INFOS } from '../../graphql/operations.js';

export default class NutritionStatus extends BaseCommand {
    static description =
        'A coverage report over every ingredient, or over the ingredients of one recipe.';

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
            const used = new Set(recipeIngredientIds(recipe));
            ingredients = ingredients.filter((ingredient) => used.has(ingredient._id));
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

        const infos =
            ingredients.length === 0
                ? []
                : ((
                      await client.request(GET_NUTRITIONAL_INFOS, {
                          ingredientIds: ingredients.map((ingredient) => ingredient._id),
                      })
                  ).nutritionalInfosByIngredientIds as unknown as NutritionalInfoSummary[]);
        const byIngredient = indexByIngredient(infos.filter(Boolean));
        const volumeUsed = volumeMeasuredIngredients(recipes);

        const report = this.summarise(ingredients, byIngredient, volumeUsed);
        this.out(
            [
                `Ingredients        ${report.total}`,
                `  linked           ${report.linked}   (${percent(report.linked, report.total)})`,
                `  missing          ${report.missing}`,
                `  countable without per-unit    ${report.countableWithoutPerUnit}`,
                `  volume-used without density   ${report.volumeUsedWithoutDensity}`,
            ].join('\n')
        );
        return { recipe: flags.recipe ?? null, ...report };
    }

    private summarise(
        ingredients: IngredientSummary[],
        byIngredient: Map<string, NutritionalInfoSummary>,
        volumeUsed: Set<string>
    ) {
        const linked = ingredients.filter((ingredient) => byIngredient.has(ingredient._id));
        const countableWithoutPerUnit = ingredients.filter(
            (ingredient) => ingredient.isCountable && !byIngredient.get(ingredient._id)?.perUnit
        );
        const volumeUsedWithoutDensity = ingredients.filter(
            (ingredient) => volumeUsed.has(ingredient._id) && !ingredient.density
        );
        return {
            total: ingredients.length,
            linked: linked.length,
            missing: ingredients.length - linked.length,
            countableWithoutPerUnit: countableWithoutPerUnit.length,
            volumeUsedWithoutDensity: volumeUsedWithoutDensity.length,
            gaps: {
                missing: ingredients
                    .filter((ingredient) => !byIngredient.has(ingredient._id))
                    .map((ingredient) => ({ _id: ingredient._id, name: ingredient.name })),
                countableWithoutPerUnit: countableWithoutPerUnit.map((ingredient) => ({
                    _id: ingredient._id,
                    name: ingredient.name,
                })),
                volumeUsedWithoutDensity: volumeUsedWithoutDensity.map((ingredient) => ({
                    _id: ingredient._id,
                    name: ingredient.name,
                })),
            },
        };
    }
}

/** Ingredient ids that some recipe measures with a volume unit. */
function volumeMeasuredIngredients(recipes: RecipeDetail[]): Set<string> {
    const ids = new Set<string>();
    for (const recipe of recipes) {
        for (const subsection of recipe.ingredientSubsections) {
            for (const entry of subsection.ingredients) {
                if (
                    entry.unit?.measureType === 'volume' &&
                    entry.ingredient.__typename === 'Ingredient'
                ) {
                    ids.add(entry.ingredient._id);
                }
            }
        }
    }
    return ids;
}
