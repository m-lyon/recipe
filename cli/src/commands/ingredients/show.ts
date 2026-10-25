import { Args } from '@oclif/core';

import { BaseCommand } from '../../lib/base.js';
import { describeSource } from '../../lib/sources.js';
import type { MeasureSummary } from '../../lib/types.js';
import { describeMeasureKey } from '../../lib/measures.js';
import { GET_ALL_RECIPES } from '../../graphql/operations.js';
import { GET_RECIPES_BY_IDS } from '../../graphql/operations.js';
import { GET_INGREDIENT_MEASURES } from '../../graphql/operations.js';
import { recipeIngredientIds, recordForPrep } from '../../lib/nutrition.js';
import { EMPTY, indent, num, renderTable, text } from '../../lib/format.js';
import { ingredientNutrition, resolveIngredient } from '../../lib/resolve.js';
import type { NutritionalInfoSummary, RecipeDetail, RecipeSummary } from '../../lib/types.js';

export default class IngredientsShow extends BaseCommand {
    static description =
        'Show one ingredient in full: its fields, its NutritionalInfo records (one with no ' +
        'prep method, and one per prep method such as juiced), and the recipes that use it.';

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

        // The plain record first, then one per prep method.
        const infos = (await ingredientNutrition(client, ingredient._id)).sort(
            (a, b) => Number(Boolean(a.prepMethod)) - Number(Boolean(b.prepMethod))
        );

        const measures = ((
            await client.request(GET_INGREDIENT_MEASURES, { ingredientIds: [ingredient._id] })
        ).ingredientMeasuresByIngredientIds ?? []) as unknown as MeasureSummary[];

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

        this.out(this.render(ingredient, infos, measures, usedBy));
        return {
            ingredient,
            // The plain record, which prices a line with no record for its prep method.
            nutritionalInfo: recordForPrep(infos, null) ?? null,
            nutritionalInfos: infos,
            ingredientMeasures: measures,
            usedBy,
        };
    }

    private render(
        ingredient: {
            _id: string;
            name: string;
            pluralName: string;
            isCountable: boolean;
            tags?: string[] | null;
        },
        infos: NutritionalInfoSummary[],
        measures: MeasureSummary[],
        usedBy: Array<{ title: string; titleIdentifier: string }>
    ): string {
        const lines = [
            `${ingredient.name} (${ingredient._id})`,
            '',
            `Plural       ${ingredient.pluralName}`,
            `Countable    ${ingredient.isCountable ? 'yes' : 'no'}`,
            `Tags         ${ingredient.tags && ingredient.tags.length > 0 ? ingredient.tags.join(', ') : EMPTY}`,
            '',
            'NUTRITION',
        ];
        if (infos.length === 0) {
            lines.push(indent('No nutritional data'));
        }
        infos.forEach((info, index) => {
            if (index > 0) lines.push('');
            lines.push(
                indent(`prep        ${info.prepMethod ? info.prepMethod.value : '(none)'}`),
                indent(`source      ${describeSource(info)}`),
                indent(`name        ${text(info.sourceName)}`),
                indent(`perGram     ${macros(info.perGram)}`)
            );
        });
        if (infos.length > 0 && !recordForPrep(infos, null)) {
            lines.push('', indent('No record without a prep method: other lines are not counted'));
        }
        lines.push('', 'MEASURES');
        lines.push(
            measures.length === 0
                ? indent('No measures')
                : indent(
                      renderTable(
                          ['ONE', 'GRAMS'],
                          measures.map((measure) => [
                              describeMeasureKey(measure),
                              num(measure.grams),
                          ])
                      )
                  )
        );
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
