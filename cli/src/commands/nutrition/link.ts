import { Args, Flags } from '@oclif/core';

import { selectPortion } from '../../lib/portions.js';
import { resolveIngredient } from '../../lib/resolve.js';
import { EMPTY, indent, num } from '../../lib/format.js';
import { USDA_FOOD_ITEM } from '../../graphql/operations.js';
import { UPDATE_NUTRITIONAL_INFO } from '../../graphql/operations.js';
import { BaseCommand, usdaFlags, writeFlags } from '../../lib/base.js';
import { notFound, rejected, wouldOverwrite } from '../../lib/errors.js';
import { formatMacros, missingMacros, perGramFrom } from '../../lib/macros.js';
import type { Macros, MeasureSummary, NutritionalInfoSummary } from '../../lib/types.js';
import { CREATE_NUTRITIONAL_INFO, GET_NUTRITIONAL_INFO } from '../../graphql/operations.js';
import { MeasureDraft, describeMeasureKey, suggestFromPortion } from '../../lib/measures.js';
import { GET_INGREDIENT_MEASURES, GET_MEASURE_COMPONENTS } from '../../graphql/operations.js';
import type { NamedSummary, UnitSummary, UsdaFoodItem, UsdaPortion } from '../../lib/types.js';
import { CREATE_INGREDIENT_MEASURE, DELETE_INGREDIENT_MEASURE } from '../../graphql/operations.js';

interface PlannedMeasure {
    /** e.g. "each · large" */
    key: string;
    portion: string;
    draft: MeasureDraft;
    /** The existing measure with the same key, replaced under --overwrite. */
    replaces: MeasureSummary | null;
}

export default class NutritionLink extends BaseCommand {
    static description =
        'Link a USDA food item to an ingredient, writing perGram, and store named USDA ' +
        'portions as ingredient measures (the weight of one unit of the ingredient).';

    static examples = [
        '<%= config.bin %> <%= command.id %> "olive oil" --fdc-id 171413 --dry-run',
        '<%= config.bin %> <%= command.id %> egg --fdc-id 171287 --portion "1 large"',
        '<%= config.bin %> <%= command.id %> onion --fdc-id 170000 --portion 1 --portion 3',
        '<%= config.bin %> <%= command.id %> "olive oil" --fdc-id 171413 --all-portions',
    ];

    static args = {
        ingredient: Args.string({ description: 'An exact name or a MongoID', required: true }),
    };

    static flags = {
        'fdc-id': Flags.integer({
            description: 'The USDA item to link',
            required: true,
            helpValue: 'N',
        }),
        portion: Flags.string({
            description:
                'Store this portion as a measure, named by its description or by its 1-based ' +
                'index in "usda show". Repeat to store several.',
            helpValue: 'LABEL|INDEX',
            multiple: true,
        }),
        'all-portions': Flags.boolean({
            description:
                'Store every portion that maps to a unit, size and prep method, and skip the rest',
            default: false,
            exclusive: ['portion'],
        }),
        overwrite: Flags.boolean({
            description:
                'Permit replacing existing nutritional data, or a measure with the same key',
            default: false,
        }),
        ...usdaFlags,
        ...writeFlags,
    };

    async run(): Promise<unknown> {
        const { args, flags } = await this.parse(NutritionLink);
        const client = this.api(flags.url);
        const fdcId = flags['fdc-id'];

        const { ingredient } = await resolveIngredient(client, args.ingredient);
        const item = (
            await client.cachedFoodItem(
                fdcId,
                USDA_FOOD_ITEM,
                { fdcId },
                { refresh: flags.refresh }
            )
        ).usdaFoodItem as unknown as UsdaFoodItem | null;
        if (!item) {
            throw notFound(`No USDA food item with fdcId ${fdcId}.`);
        }
        const portions = item.portions ?? [];

        const perGram = perGramFrom(item);
        const absent = missingMacros(item);
        if (absent.length > 0) {
            this.addWarning(
                `USDA record ${fdcId} carries no value for ${absent.join(', ')}; ` +
                    'those macros are written as zero.'
            );
        }

        const selected = flags['all-portions']
            ? portions
            : (flags.portion ?? []).map((selector) => selectPortion(portions, selector));
        const components = (await client.request(GET_MEASURE_COMPONENTS)) as unknown as {
            units: UnitSummary[];
            sizes: NamedSummary[];
            prepMethods: NamedSummary[];
        };
        const existingMeasures = ((
            await client.request(GET_INGREDIENT_MEASURES, { ingredientIds: [ingredient._id] })
        ).ingredientMeasuresByIngredientIds ?? []) as unknown as MeasureSummary[];
        const measures = this.planMeasures(
            selected,
            components,
            existingMeasures,
            flags['all-portions'],
            flags.overwrite
        );
        if (selected.length === 0) {
            this.warnUnusedPortions(portions, components);
        }

        // Checked before any write, and under --dry-run too, so a dry run reports
        // the conflict rather than describing a write that would be refused.
        const existing = (
            await client.request(GET_NUTRITIONAL_INFO, {
                ingredientId: ingredient._id,
            })
        ).nutritionalInfoByIngredient as unknown as NutritionalInfoSummary | null;
        if (existing && !flags.overwrite) {
            throw wouldOverwrite(
                `${ingredient.name} already has nutritional data (usdaFdcId ${existing.usdaFdcId ?? EMPTY}). ` +
                    'Pass --overwrite to replace it.',
                existing
            );
        }

        const record = { ingredient: ingredient._id, usdaFdcId: fdcId, perGram };
        const plan: LinkPlan = {
            dryRun: flags['dry-run'],
            action: existing ? 'update' : 'create',
            ingredient: { _id: ingredient._id, name: ingredient.name },
            usdaItem: { fdcId: item.fdcId, description: item.description },
            record,
            previous: existing ?? null,
            measures,
        };

        if (flags['dry-run']) {
            this.out(this.renderPlan(plan));
            return plan;
        }

        const written = existing
            ? (
                  await client.request(UPDATE_NUTRITIONAL_INFO, {
                      id: existing._id,
                      record,
                  })
              ).nutritionalInfoUpdateById?.record
            : (await client.request(CREATE_NUTRITIONAL_INFO, { record })).nutritionalInfoCreateOne
                  ?.record;

        const writtenMeasures = [];
        for (const measure of measures) {
            if (measure.replaces) {
                await client.request(DELETE_INGREDIENT_MEASURE, { id: measure.replaces._id });
            }
            const created = (
                await client.request(CREATE_INGREDIENT_MEASURE, {
                    record: {
                        ingredient: ingredient._id,
                        unit: measure.draft.unitId,
                        size: measure.draft.sizeId,
                        prepMethod: measure.draft.prepMethodId,
                        grams: measure.draft.grams,
                    },
                })
            ).ingredientMeasureCreateOne?.record;
            writtenMeasures.push(created);
        }

        this.out(this.renderResult(plan, written as unknown as NutritionalInfoSummary));
        return { ...plan, nutritionalInfo: written, ingredientMeasures: writtenMeasures };
    }

    /** Maps each chosen portion to a measure row, and refuses a conflict or a non-match. */
    private planMeasures(
        portions: UsdaPortion[],
        components: { units: UnitSummary[]; sizes: NamedSummary[]; prepMethods: NamedSummary[] },
        existing: MeasureSummary[],
        skipUnmatched: boolean,
        overwrite: boolean
    ): PlannedMeasure[] {
        const planned: PlannedMeasure[] = [];
        for (const portion of portions) {
            const suggestion = suggestFromPortion(
                portion,
                components.units,
                components.sizes,
                components.prepMethods
            );
            if (!suggestion) continue;
            if (!suggestion.draft) {
                if (skipUnmatched) {
                    this.addWarning(`Skipped portion ${suggestion.label}: ${suggestion.reason}.`);
                    continue;
                }
                throw rejected(
                    `Portion ${suggestion.label} cannot be stored as a measure: ${suggestion.reason}.`,
                    { portion }
                );
            }
            const draft = suggestion.draft;
            const sameKey = (m: {
                unitId: string;
                sizeId: string | null;
                prepMethodId: string | null;
            }) =>
                m.unitId === draft.unitId &&
                m.sizeId === draft.sizeId &&
                m.prepMethodId === draft.prepMethodId;
            if (planned.some((p) => sameKey(p.draft))) {
                this.addWarning(
                    `Skipped portion ${suggestion.label}: same unit, size and prep as another.`
                );
                continue;
            }
            const replaces =
                existing.find((m) =>
                    sameKey({
                        unitId: m.unit._id,
                        sizeId: m.size?._id ?? null,
                        prepMethodId: m.prepMethod?._id ?? null,
                    })
                ) ?? null;
            if (replaces && !overwrite) {
                throw wouldOverwrite(
                    `A measure for ${describeMeasureKey(replaces)} already exists ` +
                        `(${num(replaces.grams)} g). Pass --overwrite to replace it.`,
                    replaces
                );
            }
            if (portion.ambiguous) {
                this.addWarning(
                    `Portion "${portion.description}" is flagged ambiguous. Check the label ` +
                        'before trusting the weight.'
                );
            }
            const unit = components.units.find((u) => u._id === draft.unitId)!;
            const size = components.sizes.find((s) => s._id === draft.sizeId);
            const prep = components.prepMethods.find((p) => p._id === draft.prepMethodId);
            planned.push({
                key: [unit.longSingular, size?.value, prep?.value].filter(Boolean).join(' · '),
                portion: portion.description,
                draft,
                replaces,
            });
        }
        return planned;
    }

    /** Without a measure, volume and count lines of this ingredient stay uncounted. */
    private warnUnusedPortions(
        portions: UsdaPortion[],
        components: { units: UnitSummary[]; sizes: NamedSummary[]; prepMethods: NamedSummary[] }
    ): void {
        const usable = portions.filter(
            (portion) =>
                suggestFromPortion(
                    portion,
                    components.units,
                    components.sizes,
                    components.prepMethods
                )?.draft
        );
        if (usable.length > 0) {
            this.addWarning(
                `${usable.length} portion(s) can be stored as measures (${usable
                    .map((portion) => portion.description)
                    .join(', ')}) but none was chosen. Pass --portion or --all-portions.`
            );
        }
    }

    private renderMeasures(measures: PlannedMeasure[], verb: string): string[] {
        if (measures.length === 0) return [];
        return [
            '',
            `${verb} IngredientMeasures:`,
            ...measures.map((measure) =>
                indent(
                    `1 ${measure.key} = ${num(measure.draft.grams)} g   (from portion "${measure.portion}")` +
                        (measure.replaces ? `, replacing ${num(measure.replaces.grams)} g` : '')
                )
            ),
        ];
    }

    private renderPlan(plan: LinkPlan): string {
        const lines = [
            'DRY RUN — nothing was sent.',
            '',
            `Ingredient   ${plan.ingredient.name} (${plan.ingredient._id})`,
            `USDA item    ${plan.usdaItem.description} (${plan.usdaItem.fdcId})`,
            '',
            `Would ${plan.action} NutritionalInfo:`,
            indent(`ingredient  ${plan.record.ingredient}`),
            indent(`usdaFdcId   ${plan.record.usdaFdcId}`),
            indent(`perGram     ${formatMacros(plan.record.perGram)}`),
        ];
        if (plan.previous) {
            lines.push('', 'Previous values:', indent(describePrevious(plan.previous)));
        }
        lines.push(...this.renderMeasures(plan.measures, 'Would create'));
        return lines.join('\n');
    }

    private renderResult(plan: LinkPlan, written: NutritionalInfoSummary | null): string {
        const lines = [
            `${plan.action === 'create' ? 'Created' : 'Updated'} NutritionalInfo for ${plan.ingredient.name}`,
            indent(`usdaFdcId   ${plan.record.usdaFdcId}`),
            indent(`perGram     ${formatMacros(plan.record.perGram)}`),
        ];
        if (plan.previous) {
            lines.push('', 'Previous values:', indent(describePrevious(plan.previous)));
        }
        lines.push(...this.renderMeasures(plan.measures, 'Created'));
        if (written?._id) {
            lines.push('', `NutritionalInfo id ${written._id}`);
        }
        return lines.join('\n');
    }
}

interface LinkPlan {
    dryRun: boolean;
    action: 'create' | 'update';
    ingredient: { _id: string; name: string };
    usdaItem: { fdcId: number; description: string };
    record: { ingredient: string; usdaFdcId: number; perGram: Macros };
    previous: NutritionalInfoSummary | null;
    measures: PlannedMeasure[];
}

function describePrevious(info: NutritionalInfoSummary): string {
    return [
        `usdaFdcId   ${info.usdaFdcId ?? EMPTY}`,
        `perGram     ${formatMacros(info.perGram)}`,
    ].join('\n');
}
