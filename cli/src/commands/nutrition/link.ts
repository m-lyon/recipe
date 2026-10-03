import { Args, Flags } from '@oclif/core';

import { chooseDensity } from '../../lib/density.js';
import { resolveIngredient } from '../../lib/resolve.js';
import { EMPTY, indent, num } from '../../lib/format.js';
import { USDA_FOOD_ITEM } from '../../graphql/operations.js';
import { notFound, wouldOverwrite } from '../../lib/errors.js';
import { BaseCommand, usdaFlags, writeFlags } from '../../lib/base.js';
import { assertItemPortion, itemPortions, selectPortion } from '../../lib/portions.js';
import { UPDATE_INGREDIENT, UPDATE_NUTRITIONAL_INFO } from '../../graphql/operations.js';
import { formatMacros, missingMacros, perGramFrom, scaleMacros } from '../../lib/macros.js';
import { CREATE_NUTRITIONAL_INFO, GET_NUTRITIONAL_INFO } from '../../graphql/operations.js';
import type { Macros, NutritionalInfoSummary, UsdaFoodItem, UsdaPortion } from '../../lib/types.js';

/** Volume portions on one record should agree; a wider spread is worth saying. */
const DENSITY_SPREAD_WARNING = 0.02;

export default class NutritionLink extends BaseCommand {
    static description =
        'Link a USDA food item to an ingredient, writing perGram and, when a portion of kind ' +
        'item is named, perUnit.';

    static examples = [
        '<%= config.bin %> <%= command.id %> "olive oil" --fdc-id 171413 --dry-run',
        '<%= config.bin %> <%= command.id %> egg --fdc-id 171287 --portion "1 large"',
        '<%= config.bin %> <%= command.id %> "olive oil" --fdc-id 171413 --set-density',
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
                'Derive perUnit from this portion, named by its description or by its 1-based ' +
                'index in "usda show". The portion must be of kind item.',
            helpValue: 'LABEL|INDEX',
        }),
        'set-density': Flags.boolean({
            description: 'Also write the implied density to Ingredient.density',
            default: false,
        }),
        'allow-ambiguous-density': Flags.boolean({
            description: 'Permit --set-density from an ambiguous portion',
            default: false,
            dependsOn: ['set-density'],
        }),
        overwrite: Flags.boolean({
            description: 'Permit replacing existing nutritional data, or an existing density',
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

        const { portion, perUnit } = this.derivePerUnit(
            flags.portion,
            portions,
            perGram,
            ingredient.isCountable
        );

        const density = flags['set-density']
            ? this.planDensity(
                  portions,
                  flags['allow-ambiguous-density'],
                  ingredient.density ?? null,
                  flags.overwrite
              )
            : null;

        // Checked before any write, and under --dry-run too, so a dry run reports
        // the conflict rather than describing a write that would be refused.
        const existing = (
            await client.request(GET_NUTRITIONAL_INFO, {
                ingredientId: ingredient._id,
            })
        ).nutritionalInfoByIngredient as unknown as NutritionalInfoSummary | null;
        if (existing && !flags.overwrite) {
            throw wouldOverwrite(
                `${ingredient.name} already has nutritional data (usdaFdcId ${existing.usdaFdcId ?? EMPTY}, ` +
                    `linked ${describeCoverage(existing)}). Pass --overwrite to replace it.`,
                existing
            );
        }

        const record = {
            ingredient: ingredient._id,
            usdaFdcId: fdcId,
            perGram,
            // Explicitly cleared on a replacement, so a perUnit derived from a
            // different food never survives the new link.
            perUnit: perUnit ?? null,
        };

        const plan = {
            dryRun: flags['dry-run'],
            action: existing ? ('update' as const) : ('create' as const),
            ingredient: { _id: ingredient._id, name: ingredient.name },
            usdaItem: { fdcId: item.fdcId, description: item.description },
            portion: portion ?? null,
            record,
            previous: existing ?? null,
            density,
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

        let updatedIngredient = null;
        if (density) {
            updatedIngredient = (
                await client.request(UPDATE_INGREDIENT, {
                    id: ingredient._id,
                    record: { density: density.to },
                })
            ).ingredientUpdateById?.record;
        }

        this.out(this.renderResult(plan, written as unknown as NutritionalInfoSummary));
        return { ...plan, nutritionalInfo: written, ingredientUpdated: updatedIngredient };
    }

    /** Step 4 and step 5 of the link behaviour. */
    private derivePerUnit(
        selector: string | undefined,
        portions: UsdaPortion[],
        perGram: Macros,
        isCountable: boolean
    ): { portion: UsdaPortion | null; perUnit: Macros | null } {
        if (selector) {
            const portion = selectPortion(portions, selector);
            assertItemPortion(portion);
            if (portion.ambiguous) {
                this.addWarning(
                    `Portion "${portion.description}" is flagged ambiguous. Labels such as ` +
                        '"NLEA serving", "1 lemon yields" and "slice" count like items and are ' +
                        'not one whole thing. Check the label before trusting perUnit.'
                );
            }
            return { portion, perUnit: scaleMacros(perGram, portion.gramWeight) };
        }
        if (isCountable) {
            // The two reasons need different fixes, so they get different warnings.
            const items = itemPortions(portions);
            this.addWarning(
                items.length > 0
                    ? `${items.length} item portion(s) are available (${items
                          .map((portion) => portion.description)
                          .join(', ')}) but none was chosen, so perUnit is unset. ` +
                          `${'This countable ingredient stays uncalculable when used without a unit.'}`
                    : 'This USDA record offers no item portion, so perUnit is unset and this ' +
                          'countable ingredient stays uncalculable when used without a unit. ' +
                          'A retry with --portion cannot help; find another record or enter ' +
                          'perUnit by hand.'
            );
        }
        return { portion: null, perUnit: null };
    }

    /** Step 6: density is never written without --set-density. */
    private planDensity(
        portions: UsdaPortion[],
        allowAmbiguous: boolean,
        current: number | null,
        overwrite: boolean
    ): { from: number | null; to: number; portion: UsdaPortion } {
        const choice = chooseDensity(portions, allowAmbiguous);
        if (current !== null && current !== undefined && !overwrite) {
            throw wouldOverwrite(
                `This ingredient already has a density of ${current}. Pass --overwrite to ` +
                    'replace it.',
                { density: current }
            );
        }
        if (choice.spread > DENSITY_SPREAD_WARNING) {
            this.addWarning(
                `The volume portions on this record imply densities that differ by ` +
                    `${Math.round(choice.spread * 100)}%. Check "usda show" before trusting it.`
            );
        }
        return { from: current ?? null, to: choice.density, portion: choice.portion };
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
        if (plan.record.perUnit) {
            lines.push(
                indent(
                    `perUnit     ${formatMacros(plan.record.perUnit)}   (from portion "${plan.portion?.description}" = ${num(plan.portion?.gramWeight ?? 0)} g)`
                )
            );
        }
        if (plan.previous) {
            lines.push('', 'Previous values:', indent(describePrevious(plan.previous)));
        }
        if (plan.density) {
            lines.push(
                '',
                'Would update Ingredient.density:',
                indent(`from  ${plan.density.from ?? '(unset)'}`),
                indent(
                    `to    ${num(plan.density.to, 3)}   (from portion "${plan.density.portion.description}" = ${num(plan.density.portion.gramWeight)} g)`
                )
            );
        }
        return lines.join('\n');
    }

    private renderResult(plan: LinkPlan, written: NutritionalInfoSummary | null): string {
        const lines = [
            `${plan.action === 'create' ? 'Created' : 'Updated'} NutritionalInfo for ${plan.ingredient.name}`,
            indent(`usdaFdcId   ${plan.record.usdaFdcId}`),
            indent(`perGram     ${formatMacros(plan.record.perGram)}`),
            indent(`perUnit     ${formatMacros(plan.record.perUnit)}`),
        ];
        if (plan.previous) {
            lines.push('', 'Previous values:', indent(describePrevious(plan.previous)));
        }
        if (plan.density) {
            lines.push(
                '',
                `Set Ingredient.density from ${plan.density.from ?? '(unset)'} to ${num(plan.density.to, 3)}`,
                indent(`from portion "${plan.density.portion.description}"`)
            );
        }
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
    portion: UsdaPortion | null;
    record: { ingredient: string; usdaFdcId: number; perGram: Macros; perUnit: Macros | null };
    previous: NutritionalInfoSummary | null;
    density: { from: number | null; to: number; portion: UsdaPortion } | null;
}

function describeCoverage(info: NutritionalInfoSummary): string {
    const parts: string[] = [];
    if (info.perGram) parts.push('per-gram');
    if (info.perUnit) parts.push('per-unit');
    return parts.length === 0 ? 'nothing' : parts.join(' and ');
}

function describePrevious(info: NutritionalInfoSummary): string {
    return [
        `usdaFdcId   ${info.usdaFdcId ?? EMPTY}`,
        `perGram     ${formatMacros(info.perGram)}`,
        `perUnit     ${formatMacros(info.perUnit)}`,
    ].join('\n');
}
