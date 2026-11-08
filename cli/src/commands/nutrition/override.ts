import { Args, Flags } from '@oclif/core';

import { indent } from '../../lib/format.js';
import { matchUnit } from '../../lib/measures.js';
import { resolveRecipe } from '../../lib/resolve.js';
import { describeOverride } from '../../lib/nutrition.js';
import { BaseCommand, writeFlags } from '../../lib/base.js';
import { ambiguous, notFound, rejected } from '../../lib/errors.js';
import type { NutritionOverrideSummary, UnitSummary } from '../../lib/types.js';
import type { RecipeDetail, RecipeIngredientSummary } from '../../lib/types.js';
import { GET_MEASURE_COMPONENTS, SET_NUTRITION_OVERRIDE } from '../../graphql/operations.js';

const MODES = ['share', 'amount', 'negligible', 'clear'];

/** "1 cup oil", "pepper": a line as it reads. */
function describeLine(line: RecipeIngredientSummary): string {
    const name =
        line.ingredient.__typename === 'Ingredient' ? line.ingredient.name : line.ingredient.title;
    const unit = line.unit && !line.unit.hidden ? line.unit.shortSingular : null;
    return [line.quantity, unit, line.size?.value, name, line.prepMethod?.value]
        .filter(Boolean)
        .join(' ');
}

/** The line a term names: its id, or the name of its ingredient or sub-recipe. */
function matchLine(recipe: RecipeDetail, term: string): RecipeIngredientSummary {
    const lines = recipe.ingredientSubsections.flatMap((subsection) => subsection.ingredients);
    const byId = lines.find((line) => line._id === term);
    if (byId) return byId;
    const needle = term.trim().toLowerCase();
    const matches = lines.filter((line) => {
        const ingredient = line.ingredient;
        const names =
            ingredient.__typename === 'Ingredient'
                ? [ingredient.name, ingredient.pluralName]
                : [ingredient.title];
        return names.some((name) => name.toLowerCase() === needle);
    });
    if (matches.length === 1) return matches[0];
    const candidates = (matches.length > 0 ? matches : lines).map((line) => ({
        _id: line._id,
        line: describeLine(line),
    }));
    if (matches.length > 1) {
        throw ambiguous(
            `"${term}" matches ${matches.length} lines of ${recipe.title}. Pass a line id instead.`,
            candidates
        );
    }
    throw notFound(`${recipe.title} has no line with the ingredient "${term}".`, { candidates });
}

export default class NutritionOverride extends BaseCommand {
    static description =
        'Change how much of one recipe line the nutrition counts, without changing the line: ' +
        'a share of it (frying oil that is mostly not absorbed), a set amount (pepper "to ' +
        'taste"), or nothing because it is too small to count.';

    static examples = [
        '<%= config.bin %> <%= command.id %> fried-fish-a4f2k "vegetable oil" --share 15 --dry-run',
        '<%= config.bin %> <%= command.id %> fried-fish-a4f2k "black pepper" --amount 1/4 --unit tsp',
        '<%= config.bin %> <%= command.id %> fried-fish-a4f2k salt --negligible',
        '<%= config.bin %> <%= command.id %> fried-fish-a4f2k "vegetable oil" --clear',
    ];

    static args = {
        recipe: Args.string({ description: 'A titleIdentifier or a MongoID', required: true }),
        line: Args.string({
            description: 'The name of the ingredient or sub-recipe on the line, or the line id',
            required: true,
        }),
    };

    static flags = {
        share: Flags.string({
            description: 'Count this percentage of the line, from 0 to 100',
            helpValue: 'PERCENT',
            exclusive: ['amount', 'negligible', 'clear'],
        }),
        amount: Flags.string({
            description: 'Count this quantity in place of the line, such as 1/4. Needs --unit',
            helpValue: 'QUANTITY',
            exclusive: ['share', 'negligible', 'clear'],
            dependsOn: ['unit'],
        }),
        unit: Flags.string({ description: 'The unit of --amount, by any of its names' }),
        negligible: Flags.boolean({
            description: 'Count nothing: the amount is too small to count',
            exclusive: ['share', 'amount', 'clear'],
        }),
        clear: Flags.boolean({
            description: 'Count the line as written again',
            exclusive: ['share', 'amount', 'negligible'],
        }),
        ...writeFlags,
    };

    async run(): Promise<unknown> {
        const { args, flags } = await this.parse(NutritionOverride);
        if (!MODES.some((mode) => flags[mode as keyof typeof flags])) {
            throw rejected('Pass one of --share, --amount, --negligible or --clear.');
        }
        const client = this.api(flags.url);
        const recipe = await resolveRecipe(client, args.recipe);
        const line = matchLine(recipe, args.line);

        let override: NutritionOverrideSummary | null = null;
        if (flags.share !== undefined) {
            const percent = Number(flags.share);
            if (!(percent >= 0 && percent <= 100)) {
                throw rejected(`--share must be a percentage from 0 to 100, not "${flags.share}".`);
            }
            if (!line.quantity) {
                throw rejected(
                    `${describeLine(line)} has no quantity to count a share of. Use --amount.`
                );
            }
            override = { mode: 'share', percent };
        } else if (flags.amount !== undefined) {
            const components = (await client.request(GET_MEASURE_COMPONENTS)) as unknown as {
                units: UnitSummary[];
            };
            const unit = matchUnit(components.units, flags.unit!);
            if (!unit) throw notFound(`No unit named "${flags.unit}".`);
            override = { mode: 'amount', quantity: flags.amount, unit };
        } else if (flags.negligible) {
            override = { mode: 'negligible' };
        }

        const variables = {
            id: recipe._id,
            recipeIngredient: line._id!,
            nutritionOverride: override && {
                mode: override.mode,
                percent: override.percent ?? undefined,
                quantity: override.quantity ?? undefined,
                unit: override.unit?._id,
            },
        };
        const before = line.nutritionOverride
            ? describeOverride(line.nutritionOverride)
            : 'all of it';
        const after = override ? describeOverride(override) : 'all of it';
        const change = `${describeLine(line)}: counts ${after}, was ${before}`;
        const result = {
            recipe: {
                _id: recipe._id,
                title: recipe.title,
                titleIdentifier: recipe.titleIdentifier,
            },
            line: { _id: line._id, text: describeLine(line) },
            previous: line.nutritionOverride ?? null,
            nutritionOverride: override,
        };

        if (flags['dry-run']) {
            this.out(
                [
                    'DRY RUN — nothing was sent.',
                    '',
                    `Would change the nutrition of a line in ${recipe.title}:`,
                    indent(change),
                ].join('\n')
            );
            return { dryRun: true, ...result };
        }
        await client.request(SET_NUTRITION_OVERRIDE, variables);
        this.out(
            [`Changed the nutrition of a line in ${recipe.title}:`, indent(change)].join('\n')
        );
        return { dryRun: false, ...result };
    }
}
