import { Args } from '@oclif/core';

import { notFound } from '../../lib/errors.js';
import { BaseCommand } from '../../lib/base.js';
import type { Macros } from '../../lib/types.js';
import { scaleMacros } from '../../lib/macros.js';
import { resolveRecipe } from '../../lib/resolve.js';
import { indent, num, renderTable } from '../../lib/format.js';
import { RECIPE_NUTRITION } from '../../graphql/operations.js';
import type { RecipeIngredientSummary } from '../../lib/types.js';

interface LineNutrition {
    recipeIngredient: string;
    status: 'COUNTED' | 'PARTIAL' | 'UNCOUNTED';
    macros: Macros;
    reason: { code: string; message: string } | null;
    childUncounted: number | null;
    childRecipe: string | null;
}

/** "300 g Pearl Couscous", "1 garlic clove": a recipe line as it reads. */
function describeLine(line: RecipeIngredientSummary): string {
    const name =
        line.ingredient.__typename === 'Ingredient' ? line.ingredient.name : line.ingredient.title;
    const unit = line.unit && !line.unit.hidden ? line.unit.shortSingular : null;
    return [line.quantity, unit, line.size?.value, line.prepMethod?.value, name]
        .filter(Boolean)
        .join(' ');
}

export default class Nutrition extends BaseCommand {
    static description =
        "A recipe's nutrition as the API calculates it: the whole batch, one serving, and " +
        'every line that is not fully counted with its reason. Recipes used as ingredients ' +
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
                .map((line) => [String(line._id), describeLine(line)])
        );
        const lines = (data.nutrition.lines as LineNutrition[]).map((line) => ({
            ...line,
            text: textOf.get(line.recipeIngredient) ?? line.recipeIngredient,
        }));
        const uncounted = lines.filter((line) => line.status === 'UNCOUNTED');
        const partial = lines.filter((line) => line.status === 'PARTIAL');

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
            `${lines.length - uncounted.length - partial.length} of ${lines.length} lines counted`,
        ];
        if (uncounted.length > 0) {
            out.push('', `NOT COUNTED (${uncounted.length})`);
            out.push(...uncounted.map((line) => indent(`${line.text} — ${line.reason?.message}`)));
        }
        if (partial.length > 0) {
            out.push('', `PARTLY COUNTED (${partial.length})`);
            out.push(...partial.map((line) => indent(`${line.text} — ${line.reason?.message}`)));
        }
        this.out(out.join('\n'));
        return {
            _id: data._id,
            title: data.title,
            titleIdentifier: data.titleIdentifier,
            numServings: data.numServings,
            total,
            perServing,
            lines,
        };
    }
}
