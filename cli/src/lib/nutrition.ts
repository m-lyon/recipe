import type { NutritionalInfoSummary, RecipeIngredientSummary } from './types.js';

/**
 * Nutrition state of one recipe ingredient.
 *
 * `linked`  the record covers how this recipe measures the ingredient.
 * `partial` a NutritionalInfo exists but does not cover this measurement.
 * `missing` no NutritionalInfo at all.
 * `recipe`  the entry is a sub-recipe, which is not linkable.
 */
export type NutritionState = 'linked' | 'partial' | 'missing' | 'recipe';

export interface NutritionStatus {
    state: NutritionState;
    reason: string;
}

/**
 * The reason strings mirror `client/src/utils/nutrition.ts`, so the CLI and the
 * web UI describe the same gap in the same words.
 */
export function nutritionStatus(
    recipeIngredient: RecipeIngredientSummary,
    info: NutritionalInfoSummary | null | undefined
): NutritionStatus {
    const ingredient = recipeIngredient.ingredient;
    if (ingredient.__typename !== 'Ingredient') {
        return { state: 'recipe', reason: 'Sub-recipe, not linkable' };
    }
    if (!recipeIngredient.quantity) {
        return { state: info ? 'partial' : 'missing', reason: 'No quantity' };
    }
    if (!info) {
        return { state: 'missing', reason: 'No nutritional data' };
    }
    const unit = recipeIngredient.unit;
    // Case 1: no unit means a countable ingredient, which needs perUnit.
    if (!unit) {
        return info.perUnit
            ? { state: 'linked', reason: '' }
            : { state: 'partial', reason: 'No per-unit nutritional data' };
    }
    if (!info.perGram) {
        return { state: 'partial', reason: 'No per-gram nutritional data' };
    }
    // Case 2: a mass unit needs perGram only.
    if (unit.measureType === 'mass') {
        return { state: 'linked', reason: '' };
    }
    // Case 3: a volume unit needs perGram and the ingredient's density.
    if (unit.measureType === 'volume') {
        return ingredient.density
            ? { state: 'linked', reason: '' }
            : { state: 'partial', reason: 'No density set for volume-measured ingredient' };
    }
    return { state: 'partial', reason: `Unit "${unit.shortSingular}" has no measure type set` };
}

/** Indexes nutritional info records by ingredient id. */
export function indexByIngredient(
    infos: NutritionalInfoSummary[]
): Map<string, NutritionalInfoSummary> {
    return new Map(infos.map((info) => [String(info.ingredient), info]));
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
