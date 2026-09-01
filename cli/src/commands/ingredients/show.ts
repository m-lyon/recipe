import { Args } from '@oclif/core';

import { BaseCommand } from '../../lib/base.js';
import { resolveIngredient } from '../../lib/resolve.js';
import { recipeIngredientIds } from '../../lib/nutrition.js';
import { GET_RECIPES_BY_IDS } from '../../graphql/operations.js';
import { EMPTY, indent, num, renderTable, text } from '../../lib/format.js';
import { GET_ALL_RECIPES, GET_NUTRITIONAL_INFO } from '../../graphql/operations.js';
import type { NutritionalInfoSummary, RecipeDetail, RecipeSummary } from '../../lib/types.js';

export default class IngredientsShow extends BaseCommand {
    static description =
        'Show one ingredient in full: its fields, its NutritionalInfo if any, and the recipes ' +
        'that use it.';

    static examples = [
        '<%= config.bin %> <%= command.id %> "olive oil"',
        '<%= config.bin %> <%= command.id %> 65f1a2b3c4d5e6f708192a40 --json',
    ];

    static args = {
        ingredient: Args.string({ description: 'An exact name or a MongoID', required: true }),
    };

    async run(): Promise<unknown> {
        const { args, flags } = await this.parse(IngredientsShow);
        const client = this.api(flags.url);
        const { ingredient } = await resolveIngredient(client, args.ingredient);

        const info = (await client.request(GET_NUTRITIONAL_INFO, { ingredientId: ingredient._id }))
            .nutritionalInfoByIngredient as unknown as NutritionalInfoSummary | null;

        const summaries = ((await client.request(GET_ALL_RECIPES)).recipeMany ??
            []) as unknown as RecipeSummary[];
        const detailed =
            summaries.length === 0
                ? []
                : (((
                      await client.request(GET_RECIPES_BY_IDS, {
                          ids: summaries.map((recipe) => recipe._id),
                      })
                  ).recipeByIds ?? []) as unknown as RecipeDetail[]);
        const usedBy = detailed
            .filter((recipe) => recipeIngredientIds(recipe).includes(ingredient._id))
            .map((recipe) => ({
                _id: recipe._id,
                title: recipe.title,
                titleIdentifier: recipe.titleIdentifier,
            }));

        this.out(this.render(ingredient, info, usedBy));
        return { ingredient, nutritionalInfo: info ?? null, usedBy };
    }

    private render(
        ingredient: {
            _id: string;
            name: string;
            pluralName: string;
            isCountable: boolean;
            density?: number | null;
            tags?: string[] | null;
        },
        info: NutritionalInfoSummary | null,
        usedBy: Array<{ title: string; titleIdentifier: string }>
    ): string {
        const lines = [
            `${ingredient.name} (${ingredient._id})`,
            '',
            `Plural       ${ingredient.pluralName}`,
            `Countable    ${ingredient.isCountable ? 'yes' : 'no'}`,
            `Density      ${ingredient.density === null || ingredient.density === undefined ? EMPTY : num(ingredient.density, 3)}`,
            `Tags         ${ingredient.tags && ingredient.tags.length > 0 ? ingredient.tags.join(', ') : EMPTY}`,
            '',
            'NUTRITION',
        ];
        if (info) {
            lines.push(
                indent(`usdaFdcId   ${text(info.usdaFdcId ? String(info.usdaFdcId) : null)}`),
                indent(`perGram     ${macros(info.perGram)}`),
                indent(`perUnit     ${macros(info.perUnit)}`)
            );
        } else {
            lines.push(indent('No nutritional data'));
        }
        lines.push('', 'USED BY');
        lines.push(
            usedBy.length === 0
                ? indent('No recipes')
                : indent(
                      renderTable(
                          ['IDENTIFIER', 'TITLE'],
                          usedBy.map((recipe) => [recipe.titleIdentifier, recipe.title])
                      )
                  )
        );
        return lines.join('\n');
    }
}

function macros(
    value: { calories: number; protein: number; carbs: number; fat: number } | null | undefined
): string {
    if (!value) return EMPTY;
    // Printed as stored: rounding here would hide the precision the link wrote.
    return `${value.calories} kcal · ${value.protein} g protein · ${value.carbs} g carbs · ${value.fat} g fat`;
}
