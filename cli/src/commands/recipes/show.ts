import { Args } from '@oclif/core';

import { BaseCommand } from '../../lib/base.js';
import { resolveRecipe } from '../../lib/resolve.js';
import type { NutritionalInfoSummary } from '../../lib/types.js';
import { GET_NUTRITIONAL_INFOS } from '../../graphql/operations.js';
import { EMPTY, indent, renderTable, text } from '../../lib/format.js';
import { indexByIngredient, nutritionStatus, recipeIngredientIds } from '../../lib/nutrition.js';

export default class RecipesShow extends BaseCommand {
    static description =
        'Show every ingredient in a recipe, across all subsections, with its nutrition state ' +
        'and the reason it is not calculable.';

    static examples = [
        '<%= config.bin %> <%= command.id %> tomato-soup-a4f2k',
        '<%= config.bin %> <%= command.id %> tomato-soup-a4f2k --json',
    ];

    static args = {
        identifier: Args.string({
            description: 'A titleIdentifier or a MongoID',
            required: true,
        }),
    };

    async run(): Promise<unknown> {
        const { args, flags } = await this.parse(RecipesShow);
        const client = this.api(flags.url);
        const recipe = await resolveRecipe(client, args.identifier);

        const ingredientIds = recipeIngredientIds(recipe);
        const infos =
            ingredientIds.length === 0
                ? []
                : ((await client.request(GET_NUTRITIONAL_INFOS, { ingredientIds }))
                      .nutritionalInfosByIngredientIds as unknown as NutritionalInfoSummary[]);
        const byIngredient = indexByIngredient(infos.filter(Boolean));

        const blocks: string[] = [];
        const subsections = recipe.ingredientSubsections.map((subsection) => {
            const entries = subsection.ingredients.map((entry) => {
                const ingredient = entry.ingredient;
                const isRecipe = ingredient.__typename !== 'Ingredient';
                const info = isRecipe ? null : byIngredient.get(ingredient._id);
                const status = nutritionStatus(entry, info);
                return {
                    _id: ingredient._id,
                    type: isRecipe ? 'recipe' : 'ingredient',
                    name: isRecipe
                        ? (ingredient as { title: string }).title
                        : (ingredient as { name: string }).name,
                    quantity: entry.quantity ?? null,
                    unit: entry.unit?.shortSingular ?? null,
                    nutrition: status.state,
                    reason: status.reason,
                    usdaFdcId: info?.usdaFdcId ?? null,
                };
            });
            const table = renderTable(
                ['QUANTITY', 'UNIT', 'INGREDIENT', 'NUTRITION', 'REASON'],
                entries.map((entry) => [
                    text(entry.quantity),
                    text(entry.unit),
                    entry.type === 'recipe' ? `${entry.name} (sub-recipe)` : entry.name,
                    entry.nutrition,
                    entry.reason === '' ? EMPTY : entry.reason,
                ])
            );
            blocks.push(subsection.name ? `${subsection.name}\n${indent(table)}` : indent(table));
            return { name: subsection.name ?? null, ingredients: entries };
        });

        this.out(
            [`${recipe.title} (${recipe.titleIdentifier})`, '', blocks.join('\n\n')].join('\n')
        );
        return {
            _id: recipe._id,
            title: recipe.title,
            titleIdentifier: recipe.titleIdentifier,
            ingredientSubsections: subsections,
        };
    }
}
