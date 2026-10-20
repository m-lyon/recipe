import { Args, Flags } from '@oclif/core';

import { indent, num } from '../../lib/format.js';
import { ApiClient } from '../../graphql/client.js';
import { selectPortion } from '../../lib/portions.js';
import { resolveIngredient } from '../../lib/resolve.js';
import { UPDATE_NUTRITIONAL_INFO } from '../../graphql/operations.js';
import { BaseCommand, usdaFlags, writeFlags } from '../../lib/base.js';
import { notFound, rejected, wouldOverwrite } from '../../lib/errors.js';
import { formatMacros, missingMacros, perGramFrom } from '../../lib/macros.js';
import { OPEN_FOOD_FACTS_PRODUCT, USDA_FOOD_ITEM } from '../../graphql/operations.js';
import type { NutritionSource, OpenFoodFactsProduct, Per100g } from '../../lib/types.js';
import type { Macros, MeasureSummary, NutritionalInfoSummary } from '../../lib/types.js';
import { CREATE_NUTRITIONAL_INFO, GET_NUTRITIONAL_INFO } from '../../graphql/operations.js';
import { MeasureDraft, describeMeasureKey, suggestFromPortion } from '../../lib/measures.js';
import { GET_INGREDIENT_MEASURES, GET_MEASURE_COMPONENTS } from '../../graphql/operations.js';
import type { NamedSummary, UnitSummary, UsdaFoodItem, UsdaPortion } from '../../lib/types.js';
import { CREATE_INGREDIENT_MEASURE, DELETE_INGREDIENT_MEASURE } from '../../graphql/operations.js';
import { describeSource, hasValidCheckDigit, openFoodFactsProductName } from '../../lib/sources.js';

/** The record a link copies its values from, whichever source it is in. */
interface SourceRecord {
    source: Exclude<NutritionSource, 'manual'>;
    id: string;
    description: string;
    per100g: Per100g;
    portions: UsdaPortion[];
    /** Each source carries its own id and clears the other's, so an update can switch. */
    ids: { usdaFdcId: number | null; openFoodFactsBarcode: string | null };
}

interface SelectedPortion {
    portion: UsdaPortion;
    /** From --default-portion: stored without its size. */
    unsized: boolean;
}

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
        'Link a USDA food item or an Open Food Facts product to an ingredient, writing ' +
        'perGram, and store its named portions as ingredient measures (the weight of one ' +
        'unit of the ingredient).';

    static examples = [
        '<%= config.bin %> <%= command.id %> "olive oil" --fdc-id 171413 --dry-run',
        '<%= config.bin %> <%= command.id %> egg --fdc-id 171287 --portion "1 large"',
        '<%= config.bin %> <%= command.id %> onion --fdc-id 170000 --portion 1 --portion 3',
        '<%= config.bin %> <%= command.id %> "olive oil" --fdc-id 171413 --all-portions',
        '<%= config.bin %> <%= command.id %> banana --fdc-id 173944 --portion 5 --default-portion 5',
        '<%= config.bin %> <%= command.id %> "pearl couscous" --barcode 5010338301255 --dry-run',
    ];

    static args = {
        ingredient: Args.string({ description: 'An exact name or a MongoID', required: true }),
    };

    static flags = {
        'fdc-id': Flags.integer({
            description: 'The USDA item to link',
            helpValue: 'N',
            exactlyOne: ['fdc-id', 'barcode'],
        }),
        barcode: Flags.string({
            description: 'The Open Food Facts product to link, by its barcode',
            helpValue: 'DIGITS',
            exactlyOne: ['fdc-id', 'barcode'],
        }),
        portion: Flags.string({
            description:
                'Store this portion as a measure, named by its description or by its 1-based ' +
                'index in "usda show" or "open-food-facts show". Repeat to store several.',
            helpValue: 'LABEL|INDEX',
            multiple: true,
        }),
        'all-portions': Flags.boolean({
            description:
                'Store every portion that maps to a unit, size and prep method, and skip the rest',
            default: false,
            exclusive: ['portion'],
        }),
        'default-portion': Flags.string({
            description:
                'Store this sized item portion as a measure with no size, so that recipe lines ' +
                'with no size use its weight. Named like --portion.',
            helpValue: 'LABEL|INDEX',
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

        const { ingredient } = await resolveIngredient(client, args.ingredient);
        const item = flags.barcode
            ? await this.fetchOffProduct(client, flags.barcode.trim(), flags.refresh)
            : await this.fetchUsdaItem(client, flags['fdc-id']!, flags.refresh);
        const portions = item.portions;

        const perGram = perGramFrom(item.per100g);
        const absent = missingMacros(item.per100g);
        if (absent.length > 0) {
            this.addWarning(
                `${describeSource(item.ids)} carries no value for ${absent.join(', ')}; ` +
                    'those macros are written as zero.'
            );
        }

        const selected: SelectedPortion[] = (
            flags['all-portions']
                ? portions
                : (flags.portion ?? []).map((selector) => selectPortion(portions, selector))
        ).map((portion) => ({ portion, unsized: false }));
        if (flags['default-portion']) {
            selected.push({
                portion: selectPortion(portions, flags['default-portion']),
                unsized: true,
            });
        }
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
                `${ingredient.name} already has nutritional data (${describeSource(existing)}). ` +
                    'Pass --overwrite to replace it.',
                existing
            );
        }

        const record = {
            ingredient: ingredient._id,
            source: item.source,
            ...item.ids,
            sourceName: item.description,
            perGram,
        };
        const plan: LinkPlan = {
            dryRun: flags['dry-run'],
            action: existing ? 'update' : 'create',
            ingredient: { _id: ingredient._id, name: ingredient.name },
            item: { source: item.source, id: item.id, description: item.description },
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

    private async fetchUsdaItem(
        client: ApiClient,
        fdcId: number,
        refresh: boolean
    ): Promise<SourceRecord> {
        const item = (await client.cachedFoodItem(fdcId, USDA_FOOD_ITEM, { fdcId }, { refresh }))
            .usdaFoodItem as unknown as UsdaFoodItem | null;
        if (!item) {
            throw notFound(`No USDA food item with fdcId ${fdcId}.`);
        }
        return {
            source: 'usda',
            id: String(item.fdcId),
            description: item.description,
            per100g: item,
            portions: item.portions ?? [],
            ids: { usdaFdcId: item.fdcId, openFoodFactsBarcode: null },
        };
    }

    private async fetchOffProduct(
        client: ApiClient,
        barcode: string,
        refresh: boolean
    ): Promise<SourceRecord> {
        if (!hasValidCheckDigit(barcode)) {
            this.addWarning(`${barcode} fails the barcode check digit. Check for a misread digit.`);
        }
        const product = (
            await client.cachedOpenFoodFactsProduct(
                barcode,
                OPEN_FOOD_FACTS_PRODUCT,
                { barcode },
                { refresh }
            )
        ).openFoodFactsProduct as unknown as OpenFoodFactsProduct | null;
        if (!product) {
            throw notFound(`No Open Food Facts product with barcode ${barcode}.`);
        }
        // Volunteers enter this data: a missing macro or kcal the macros do not explain
        // is worth a look at the label before the link is trusted.
        for (const warning of product.warnings) {
            this.addWarning(`Open Food Facts ${barcode}: ${warning}.`);
        }
        return {
            source: 'openFoodFacts',
            id: product.barcode,
            description: openFoodFactsProductName(product),
            per100g: product,
            portions: product.portions ?? [],
            ids: { usdaFdcId: null, openFoodFactsBarcode: product.barcode },
        };
    }

    /** Maps each chosen portion to a measure row, and refuses a conflict or a non-match. */
    private planMeasures(
        portions: SelectedPortion[],
        components: { units: UnitSummary[]; sizes: NamedSummary[]; prepMethods: NamedSummary[] },
        existing: MeasureSummary[],
        skipUnmatched: boolean,
        overwrite: boolean
    ): PlannedMeasure[] {
        const planned: PlannedMeasure[] = [];
        for (const { portion, unsized } of portions) {
            const suggestion = suggestFromPortion(
                portion,
                components.units,
                components.sizes,
                components.prepMethods
            );
            if (!suggestion) {
                if (skipUnmatched) continue;
                throw rejected(
                    `Portion ${portion.description} is a weight, already covered by perGram, ` +
                        'and is not stored as a measure.',
                    { portion }
                );
            }
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
            if (unsized && !suggestion.draft.sizeId) {
                throw rejected(
                    `Portion ${suggestion.label} has no size, so --default-portion does not ` +
                        'apply. Pass it to --portion instead.',
                    { portion }
                );
            }
            // The default size: lines with no size match only a measure with no size.
            const draft = unsized ? { ...suggestion.draft, sizeId: null } : suggestion.draft;
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
            `Source       ${describeSource(plan.record)}  ·  ${plan.item.description}`,
            '',
            `Would ${plan.action} NutritionalInfo:`,
            indent(`ingredient  ${plan.record.ingredient}`),
            indent(`source      ${describeSource(plan.record)}`),
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
            indent(`source      ${describeSource(plan.record)}`),
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
    item: { source: SourceRecord['source']; id: string; description: string };
    record: {
        ingredient: string;
        source: SourceRecord['source'];
        usdaFdcId: number | null;
        openFoodFactsBarcode: string | null;
        sourceName: string;
        perGram: Macros;
    };
    previous: NutritionalInfoSummary | null;
    measures: PlannedMeasure[];
}

function describePrevious(info: NutritionalInfoSummary): string {
    return [
        `source      ${describeSource(info)}`,
        `perGram     ${formatMacros(info.perGram)}`,
    ].join('\n');
}
