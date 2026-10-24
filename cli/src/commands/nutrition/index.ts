import { Args } from '@oclif/core';

import { notFound } from '../../lib/errors.js';
import { BaseCommand } from '../../lib/base.js';
import type { Macros } from '../../lib/types.js';
import { scaleMacros } from '../../lib/macros.js';
import { resolveRecipe } from '../../lib/resolve.js';
import { indent, num, renderTable } from '../../lib/format.js';
import { RECIPE_NUTRITION } from '../../graphql/operations.js';
import type { RecipeIngredientSummary } from '../../lib/types.js';

interface IngredientNutrition {
    recipeIngredient: string;
    status: 'COUNTED' | 'PARTIAL' | 'UNCOUNTED';
    macros: Macros;
    reason: { code: string; message: string } | null;
    childUncounted: number | null;
    childRecipe: string | null;
}

/** "300 g Pearl Couscous", "1 garlic clove": an ingredient as it reads. */
function describeIngredient(item: RecipeIngredientSummary): string {
    const name =
        item.ingredient.__typename === 'Ingredient' ? item.ingredient.name : item.ingredient.title;
    const unit = item.unit && !item.unit.hidden ? item.unit.shortSingular : null;
    return [item.quantity, unit, item.size?.value, item.prepMethod?.value, name]
        .filter(Boolean)
        .join(' ');
}

export default class Nutrition extends BaseCommand {
    static description =
        "A recipe's nutrition as the API calculates it: the whole batch, one serving, and " +
        'every ingredient that is not fully counted with its reason. Recipes used as ingredients ' +
        'count through their yield.';

    static examples = [
        '<%= config.bin %> <%= command.id %> pesto-couscous-salad-abwmo',
        '<%= config.bin %> <%= command.id %> pesto-couscous-salad-abwmo --json',
    ];

    static args = {
        identifier: Args.string({ description: 'A titleIdentifier or a MongoID', required: true }),
    };

    async run(): Promise<unknown> {
        const { args, flags } = await this.parse(Nutrition);
        const client = this.api(flags.url);
        const recipe = await resolveRecipe(client, args.identifier);
        const data = (await client.request(RECIPE_NUTRITION, { id: recipe._id })).recipeById;
        if (!data) {
            throw notFound(`No recipe with id ${recipe._id}.`);
        }
        const total = data.nutrition.total as Macros;
        const servings = data.numServings > 0 ? data.numServings : 1;
        const perServing = scaleMacros(total, 1 / servings);

        const textOf = new Map(
            recipe.ingredientSubsections
                .flatMap((subsection) => subsection.ingredients)
                .map((ingredient) => [String(ingredient._id), describeIngredient(ingredient)])
        );
        const ingredients = (data.nutrition.ingredients as IngredientNutrition[]).map(
            (ingredient) => ({
                ...ingredient,
                text: textOf.get(ingredient.recipeIngredient) ?? ingredient.recipeIngredient,
            })
        );
        const uncounted = ingredients.filter((ingredient) => ingredient.status === 'UNCOUNTED');
        const partial = ingredients.filter((ingredient) => ingredient.status === 'PARTIAL');

        const table = renderTable(
            ['', 'BATCH', `PER SERVING (of ${servings})`],
            (
                [
                    ['kcal', 'calories'],
                    ['protein', 'protein'],
                    ['carbs', 'carbs'],
                    ['fat', 'fat'],
                ] as Array<[string, keyof Macros]>
            ).map(([label, key]) => [label, num(total[key]), num(perServing[key])])
        );
        const out = [
            `${data.title} (${data.titleIdentifier})`,
            '',
            table,
            '',
            `${ingredients.length - uncounted.length - partial.length} of ${ingredients.length} ingredients counted`,
        ];
        if (uncounted.length > 0) {
            out.push('', `NOT COUNTED (${uncounted.length})`);
            out.push(
                ...uncounted.map((ingredient) =>
                    indent(`${ingredient.text} — ${ingredient.reason?.message}`)
                )
            );
        }
        if (partial.length > 0) {
            out.push('', `PARTLY COUNTED (${partial.length})`);
            out.push(
                ...partial.map((ingredient) =>
                    indent(`${ingredient.text} — ${ingredient.reason?.message}`)
                )
            );
        }
        this.out(out.join('\n'));
        return {
            _id: data._id,
            title: data.title,
            titleIdentifier: data.titleIdentifier,
            numServings: data.numServings,
            total,
            perServing,
            ingredients,
        };
    }
}
