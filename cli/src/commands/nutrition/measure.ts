import { Args, Flags } from '@oclif/core';

import { indent, num } from '../../lib/format.js';
import { resolveIngredient } from '../../lib/resolve.js';
import { BaseCommand, writeFlags } from '../../lib/base.js';
import { notFound, rejected, wouldOverwrite } from '../../lib/errors.js';
import { describeMeasureKey, matchNamed, matchUnit } from '../../lib/measures.js';
import type { MeasureSummary, NamedSummary, UnitSummary } from '../../lib/types.js';
import { GET_INGREDIENT_MEASURES, GET_MEASURE_COMPONENTS } from '../../graphql/operations.js';
import { CREATE_INGREDIENT_MEASURE, DELETE_INGREDIENT_MEASURE } from '../../graphql/operations.js';

export default class NutritionMeasure extends BaseCommand {
    static description =
        'Store a measure you weighed or read from a label: the weight of one unit of an ' +
        'ingredient. Use it when no USDA portion carries the unit, such as a scoop.';

    static examples = [
        '<%= config.bin %> <%= command.id %> "protein powder" --unit scoop --grams 30 --dry-run',
        '<%= config.bin %> <%= command.id %> onion --unit each --size large --grams 150',
    ];

    static args = {
        ingredient: Args.string({ description: 'An exact name or a MongoID', required: true }),
    };

    static flags = {
        unit: Flags.string({
            description: 'A count or volume unit, by any of its names',
            required: true,
        }),
        grams: Flags.string({
            description: 'The weight of one unit, in grams',
            required: true,
            helpValue: 'N',
        }),
        size: Flags.string({ description: 'A size, such as large' }),
        prep: Flags.string({ description: 'A prep method, such as chopped' }),
        overwrite: Flags.boolean({
            description: 'Permit replacing a measure with the same unit, size and prep method',
            default: false,
        }),
        ...writeFlags,
    };

    async run(): Promise<unknown> {
        const { args, flags } = await this.parse(NutritionMeasure);
        const client = this.api(flags.url);

        const grams = Number(flags.grams);
        if (!(grams > 0)) {
            throw rejected(`--grams must be a positive number, not "${flags.grams}".`);
        }
        const { ingredient } = await resolveIngredient(client, args.ingredient);
        const components = (await client.request(GET_MEASURE_COMPONENTS)) as unknown as {
            units: UnitSummary[];
            sizes: NamedSummary[];
            prepMethods: NamedSummary[];
        };

        const unit = matchUnit(components.units, flags.unit);
        if (!unit) {
            throw notFound(`No unit named "${flags.unit}".`);
        }
        // A mass line converts by the unit's size alone, so a measure would never be read.
        if (unit.dimension === 'mass') {
            throw rejected(`${unit.longSingular} is a mass unit and needs no measure.`);
        }
        const size = flags.size ? matchNamed(components.sizes, flags.size) : null;
        if (flags.size && !size) {
            throw notFound(`No size named "${flags.size}".`);
        }
        const prep = flags.prep ? matchNamed(components.prepMethods, flags.prep) : null;
        if (flags.prep && !prep) {
            throw notFound(`No prep method named "${flags.prep}".`);
        }

        const existing = ((
            await client.request(GET_INGREDIENT_MEASURES, { ingredientIds: [ingredient._id] })
        ).ingredientMeasuresByIngredientIds ?? []) as unknown as MeasureSummary[];
        const replaces =
            existing.find(
                (m) =>
                    m.unit._id === unit._id &&
                    (m.size?._id ?? null) === (size?._id ?? null) &&
                    (m.prepMethod?._id ?? null) === (prep?._id ?? null)
            ) ?? null;
        if (replaces && !flags.overwrite) {
            throw wouldOverwrite(
                `A measure for ${describeMeasureKey(replaces)} already exists ` +
                    `(${num(replaces.grams)} g). Pass --overwrite to replace it.`,
                replaces
            );
        }

        const record = {
            ingredient: ingredient._id,
            unit: unit._id,
            size: size?._id ?? null,
            prepMethod: prep?._id ?? null,
            grams,
        };
        const key = [unit.longSingular, size?.value, prep?.value].filter(Boolean).join(' · ');
        const line =
            `1 ${key} = ${num(grams)} g` + (replaces ? `, replacing ${num(replaces.grams)} g` : '');

        if (flags['dry-run']) {
            this.out(
                [
                    'DRY RUN — nothing was sent.',
                    '',
                    `Would create an IngredientMeasure for ${ingredient.name}:`,
                    indent(line),
                ].join('\n')
            );
            return { dryRun: true, ingredient, record, replaces };
        }

        if (replaces) {
            await client.request(DELETE_INGREDIENT_MEASURE, { id: replaces._id });
        }
        const created = (await client.request(CREATE_INGREDIENT_MEASURE, { record }))
            .ingredientMeasureCreateOne?.record;
        this.out([`Created an IngredientMeasure for ${ingredient.name}:`, indent(line)].join('\n'));
        return { dryRun: false, ingredient, record, replaces, ingredientMeasure: created };
    }
}
