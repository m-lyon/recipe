import { Args, Flags } from '@oclif/core';

import { indent, num } from '../../lib/format.js';
import { describeSource } from '../../lib/sources.js';
import { BaseCommand, writeFlags } from '../../lib/base.js';
import { rejected, wouldOverwrite } from '../../lib/errors.js';
import type { NutritionalInfoSummary } from '../../lib/types.js';
import { UPDATE_NUTRITIONAL_INFO } from '../../graphql/operations.js';
import { CREATE_NUTRITIONAL_INFO } from '../../graphql/operations.js';
import { kcalMismatch, parseLabelPer100g } from '../../lib/macros.js';
import { describeTarget, recordForPrep } from '../../lib/nutrition.js';
import { ingredientNutrition, resolveIngredient } from '../../lib/resolve.js';
import { formatMacros, perGramFrom, round, scaleMacros } from '../../lib/macros.js';
import type { Macros, MeasureSummary, NamedSummary, Per100g } from '../../lib/types.js';
import { densityFor, describeMeasureKey, resolvePrepMethod } from '../../lib/measures.js';
import { GET_INGREDIENT_MEASURES, GET_MEASURE_COMPONENTS } from '../../graphql/operations.js';

interface SetPlan {
    dryRun: boolean;
    action: 'create' | 'update';
    ingredient: { _id: string; name: string };
    prepMethod: NamedSummary | null;
    /** The values as given, and their basis. */
    values: { per: '100g' | '100ml'; values: Required<Per100g> };
    /** Per 100 ml only: the volume measure that converts millilitres to grams. */
    density: { gramsPerMillilitre: number; measure: string } | null;
    record: {
        ingredient: string;
        prepMethod: string | null;
        source: 'manual';
        usdaFdcId: null;
        openFoodFactsBarcode: null;
        sourceName: string | null;
        perGram: Macros;
    };
    previous: NutritionalInfoSummary | null;
}

export default class NutritionSet extends BaseCommand {
    static description =
        'Write nutritional data entered by hand, from a pack label or another source that ' +
        'is not USDA or Open Food Facts. The record is linked to no database.';

    static examples = [
        '<%= config.bin %> <%= command.id %> "stock pot" --per-100g 33,1.4,2.1,2 --name "Pack label" --dry-run',
        '<%= config.bin %> <%= command.id %> lime --prep juiced --per-100ml 25,0.4,8.4,0.1',
    ];

    static args = {
        ingredient: Args.string({ description: 'An exact name or a MongoID', required: true }),
    };

    static flags = {
        'per-100g': Flags.string({
            description: 'The values per 100 g',
            helpValue: 'KCAL,PROTEIN,CARBS,FAT',
            exactlyOne: ['per-100g', 'per-100ml'],
        }),
        'per-100ml': Flags.string({
            description:
                'The values per 100 ml, for a liquid. Converted to grams with the ' +
                "ingredient's volume measure for the same prep method, which must exist.",
            helpValue: 'KCAL,PROTEIN,CARBS,FAT',
            exactlyOne: ['per-100g', 'per-100ml'],
        }),
        prep: Flags.string({
            description:
                'Write the record for this prep method, such as juiced: the prepared food, ' +
                'used for recipe lines with that prep method',
        }),
        name: Flags.string({
            description: 'Where the values came from, such as "Tesco pack label"',
        }),
        overwrite: Flags.boolean({
            description: 'Permit replacing existing nutritional data',
            default: false,
        }),
        ...writeFlags,
    };

    async run(): Promise<unknown> {
        const { args, flags } = await this.parse(NutritionSet);
        const client = this.api(flags.url);

        // Checked before any request, so a typo costs nothing.
        const per = flags['per-100ml'] ? '100ml' : '100g';
        const given = (flags['per-100ml'] ?? flags['per-100g'])!;
        const values = parseLabelPer100g(given);
        if (!values) {
            throw rejected(
                `--per-${per} takes four numbers, "kcal,protein,carbs,fat", not "${given}".`
            );
        }
        const mismatch = kcalMismatch(values);
        if (mismatch) {
            this.addWarning(`Values: ${mismatch}. Check the order of the values.`);
        }
        const name = flags.name?.trim() || null;

        const { ingredient } = await resolveIngredient(client, args.ingredient);
        const prep = flags.prep
            ? resolvePrepMethod(
                  ((await client.request(GET_MEASURE_COMPONENTS)).prepMethods ??
                      []) as unknown as NamedSummary[],
                  flags.prep
              )
            : null;

        let density: SetPlan['density'] = null;
        let perGram = perGramFrom(values);
        if (per === '100ml') {
            const measures = ((
                await client.request(GET_INGREDIENT_MEASURES, { ingredientIds: [ingredient._id] })
            ).ingredientMeasuresByIngredientIds ?? []) as unknown as MeasureSummary[];
            const found = densityFor(measures, prep?._id ?? null);
            if (!found) {
                const prepFlag = prep ? ` --prep "${prep.value}"` : '';
                throw rejected(
                    `${describeTarget(ingredient.name, prep)} has no volume measure, so ` +
                        'millilitres cannot be converted to grams. Store one first, from a ' +
                        `weighed volume: nutrition measure "${ingredient.name}" --unit ` +
                        `millilitre${prepFlag} --grams <weight of 1 ml>.`
                );
            }
            density = {
                gramsPerMillilitre: round(found.gramsPerMillilitre),
                // Printed as stored: a millilitre weighs about a gram, so one decimal hides it.
                measure: `1 ${describeMeasureKey(found.measure)} = ${found.measure.grams} g`,
            };
            // The values are per millilitre; divide by the grams in a millilitre.
            perGram = scaleMacros(perGramFrom(values), 1 / found.gramsPerMillilitre);
        }

        // Checked before any write, and under --dry-run too.
        const existing = recordForPrep(
            await ingredientNutrition(client, ingredient._id),
            prep?._id ?? null
        );
        if (existing && !flags.overwrite) {
            throw wouldOverwrite(
                `${describeTarget(ingredient.name, prep)} already has nutritional data ` +
                    `(${describeSource(existing)}). Pass --overwrite to replace it.`,
                existing
            );
        }

        const plan: SetPlan = {
            dryRun: flags['dry-run'],
            action: existing ? 'update' : 'create',
            ingredient: { _id: ingredient._id, name: ingredient.name },
            prepMethod: prep,
            values: { per, values },
            density,
            record: {
                ingredient: ingredient._id,
                prepMethod: prep?._id ?? null,
                source: 'manual',
                // An update from a linked source clears its id.
                usdaFdcId: null,
                openFoodFactsBarcode: null,
                sourceName: name,
                perGram,
            },
            previous: existing ?? null,
        };

        if (flags['dry-run']) {
            this.out(['DRY RUN — nothing was sent.', '', ...this.render(plan, 'Would')].join('\n'));
            return plan;
        }

        const written = existing
            ? (
                  await client.request(UPDATE_NUTRITIONAL_INFO, {
                      id: existing._id,
                      record: plan.record,
                  })
              ).nutritionalInfoUpdateById?.record
            : (await client.request(CREATE_NUTRITIONAL_INFO, { record: plan.record }))
                  .nutritionalInfoCreateOne?.record;
        const lines = this.render(plan, plan.action === 'create' ? 'Created' : 'Updated');
        if (written?._id) {
            lines.push('', `NutritionalInfo id ${written._id}`);
        }
        this.out(lines.join('\n'));
        return { ...plan, nutritionalInfo: written };
    }

    private render(plan: SetPlan, verb: string): string[] {
        const { values } = plan.values;
        const lines = [
            `${verb} ${verb === 'Would' ? `${plan.action} ` : ''}NutritionalInfo for ` +
                describeTarget(plan.ingredient.name, plan.prepMethod),
            indent(
                `source      manual${plan.record.sourceName ? ` · ${plan.record.sourceName}` : ''}`
            ),
            indent(
                `per ${plan.values.per === '100g' ? '100 g ' : '100 ml'}  ${num(values.caloriesPer100g)} kcal · ` +
                    `${num(values.proteinPer100g)} g protein · ${num(values.carbsPer100g)} g carbs · ` +
                    `${num(values.fatPer100g)} g fat`
            ),
        ];
        if (plan.density) {
            lines.push(
                indent(
                    `density     ${num(plan.density.gramsPerMillilitre, 3)} g/ml, from ${plan.density.measure}`
                )
            );
        }
        lines.push(indent(`perGram     ${formatMacros(plan.record.perGram)}`));
        if (plan.previous) {
            lines.push(
                '',
                'Previous values:',
                indent(`source      ${describeSource(plan.previous)}`),
                indent(`perGram     ${formatMacros(plan.previous.perGram)}`)
            );
        }
        return lines;
    }
}
