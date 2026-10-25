import type { NamedSummary } from './types.js';
import { describeOneUnit, findMeasure } from './measures.js';
import type { MeasureSummary, NutritionalInfoSummary, RecipeIngredientSummary } from './types.js';

/**
 * Nutrition state of one recipe ingredient.
 *
 * `linked`  the line resolves to grams and has per-gram macros: it is calculable.
 * `partial` a NutritionalInfo exists but the line cannot reach grams.
 * `missing` no NutritionalInfo at all.
 * `recipe`  the entry is a sub-recipe, which is not linkable.
 */
export type NutritionState = 'linked' | 'partial' | 'missing' | 'recipe';

export interface NutritionStatus {
    state: NutritionState;
    reason: string;
    /** "1 cup of honey" when a measure would make the line calculable. */
    missingWeight?: string;
}

/**
 * The reason strings mirror `client/src/utils/nutrition.ts`, so the CLI and the
 * web UI describe the same gap in the same words.
 */
export function nutritionStatus(
    recipeIngredient: RecipeIngredientSummary,
    records: NutritionalInfoSummary[] | null | undefined,
    measures: MeasureSummary[] = []
): NutritionStatus {
    const ingredient = recipeIngredient.ingredient;
    if (ingredient.__typename !== 'Ingredient') {
        return { state: 'recipe', reason: 'Sub-recipe, not linkable' };
    }
    const info = findNutrition(records, recipeIngredient.prepMethod?._id ?? null);
    if (!recipeIngredient.quantity) {
        return { state: info ? 'partial' : 'missing', reason: 'No quantity' };
    }
    if (!info) {
        return { state: 'missing', reason: 'No nutritional data' };
    }
    const unit = recipeIngredient.unit;
    if (!unit) {
        return { state: 'partial', reason: 'No unit' };
    }
    // Mass converts by the unit's size alone; volume and count need a measure.
    if (unit.dimension === 'mass') {
        return { state: 'linked', reason: '' };
    }
    const found = findMeasure(measures, {
        unit,
        sizeId: recipeIngredient.size?._id ?? null,
        prepMethodId: recipeIngredient.prepMethod?._id ?? null,
    });
    if (found) {
        return { state: 'linked', reason: '' };
    }
    const one = describeOneUnit(unit, ingredient.name, recipeIngredient.size?.value);
    return { state: 'partial', reason: `No weight recorded for ${one}`, missingWeight: one };
}

/** Indexes nutritional info records by ingredient id: each ingredient has one record with no
 *  prep method, and one for each prep method that changes the food. */
export function indexByIngredient(
    infos: NutritionalInfoSummary[]
): Map<string, NutritionalInfoSummary[]> {
    const index = new Map<string, NutritionalInfoSummary[]>();
    for (const info of infos) {
        const key = String(info.ingredient);
        index.set(key, [...(index.get(key) ?? []), info]);
    }
    return index;
}

/** The record with exactly this prep method, or with none when it is null. */
export function recordForPrep(
    records: NutritionalInfoSummary[] | null | undefined,
    prepMethodId: string | null
): NutritionalInfoSummary | undefined {
    return records?.find((record) => (record.prepMethod?._id ?? null) === prepMethodId);
}

/**
 * The record that prices a recipe line, as the API picks it: the record for the line's prep
 * method, or else the record with no prep method. "Lime, juiced" uses the juice record; "lime,
 * sliced" uses the lime record.
 */
export function findNutrition(
    records: NutritionalInfoSummary[] | null | undefined,
    prepMethodId: string | null
): NutritionalInfoSummary | undefined {
    return (
        (prepMethodId ? recordForPrep(records, prepMethodId) : undefined) ??
        recordForPrep(records, null)
    );
}

/** Every distinct ingredient id used across a recipe's subsections. */
export function recipeIngredientIds(subsections: {
    ingredientSubsections: Array<{ ingredients: RecipeIngredientSummary[] }>;
}): string[] {
    const ids = new Set<string>();
    for (const subsection of subsections.ingredientSubsections) {
        for (const entry of subsection.ingredients) {
            if (entry.ingredient.__typename === 'Ingredient') {
                ids.add(entry.ingredient._id);
            }
        }
    }
    return [...ids];
}

/** "lime" or "lime (juiced)": the record a write names. */
export function describeTarget(name: string, prep: NamedSummary | null): string {
    return prep ? `${name} (${prep.value})` : name;
}
