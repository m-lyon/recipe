import { Fraction, fraction } from 'mathjs';

import { IngredientMeasureFieldsFragment } from '@recipe/graphql/generated';

import { isFraction, isRange } from './number';

export interface MacroNutrients {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
}

export interface NutritionalInfoData {
    perGram: MacroNutrients;
}

export interface CalculatedIngredientNutrition {
    calculable: boolean;
    macros: MacroNutrients;
    /** Human-readable explanation when not calculable */
    reason?: string;
    /** True when the line failed only because no measure matched it. */
    missingMeasure?: boolean;
}

const ZERO_MACROS: MacroNutrients = { calories: 0, protein: 0, carbs: 0, fat: 0 };

function scaleMacros(macros: MacroNutrients, factor: number): MacroNutrients {
    return {
        calories: macros.calories * factor,
        protein: macros.protein * factor,
        carbs: macros.carbs * factor,
        fat: macros.fat * factor,
    };
}

export function addMacros(a: MacroNutrients, b: MacroNutrients): MacroNutrients {
    return {
        calories: a.calories + b.calories,
        protein: a.protein + b.protein,
        carbs: a.carbs + b.carbs,
        fat: a.fat + b.fat,
    };
}

/**
 * Parse a quantity string (fraction, decimal, or range) to a single float.
 * For ranges, returns the midpoint.
 */
export function quantityToFloat(quantity: string): number {
    if (isRange(quantity)) {
        const parts = quantity.split('-').map((s) => quantityToFloat(s.trim()));
        if (parts.length !== 2 || !isFinite(parts[0]) || !isFinite(parts[1])) {
            return NaN;
        }
        return (parts[0] + parts[1]) / 2;
    }
    if (isFraction(quantity)) {
        const f = fraction(quantity) as Fraction;
        return f.n / f.d;
    }
    return parseFloat(quantity);
}

export type IngredientMeasureData = IngredientMeasureFieldsFragment;

/** The key of a measure lookup: the recipe line's unit, size and prep method. */
export interface MeasureKey {
    unit: IngredientMeasureData['unit'];
    sizeId: string | null;
    prepMethodId: string | null;
}

/** Grams in one of the key's unit, and the measure row that supplied it. */
export interface FoundMeasure {
    gramsPerUnit: number;
    measure: IngredientMeasureData;
}

function specificity(measure: IngredientMeasureData): number {
    return (measure.size ? 1 : 0) + (measure.prepMethod ? 1 : 0);
}

/**
 * The most specific measure that matches a recipe line:
 *  1. exact (unit, size, prep)
 *  2. drop prep (unit, size)
 *  3. drop size (unit)
 *  4. volume only: the least specific volume row, rescaled by perCanonical
 * An exact unit match beats rescaling, so an ingredient may carry several volume rows.
 */
export function findMeasure(
    measures: IngredientMeasureData[],
    key: MeasureKey
): FoundMeasure | null {
    const forUnit = measures.filter((m) => m.unit._id === key.unit._id);
    const sizeId = (m: IngredientMeasureData) => m.size?._id ?? null;
    const prepId = (m: IngredientMeasureData) => m.prepMethod?._id ?? null;
    const match =
        forUnit.find((m) => sizeId(m) === key.sizeId && prepId(m) === key.prepMethodId) ??
        forUnit.find((m) => sizeId(m) === key.sizeId && prepId(m) === null) ??
        forUnit.find((m) => sizeId(m) === null && prepId(m) === null);
    if (match) {
        return { gramsPerUnit: match.grams, measure: match };
    }
    if (key.unit.dimension !== 'volume') {
        return null;
    }
    const volume = measures
        .filter((m) => m.unit.dimension === 'volume')
        .sort((a, b) => specificity(a) - specificity(b))[0];
    if (!volume) {
        return null;
    }
    const gramsPerMl = volume.grams / volume.unit.perCanonical;
    return { gramsPerUnit: gramsPerMl * key.unit.perCanonical, measure: volume };
}

/** "1 cup of honey", "1 large onion": the thing whose weight is missing. */
export function describeOneUnit(
    unit: Pick<IngredientMeasureData['unit'], 'longSingular' | 'hidden'>,
    ingredientName: string,
    sizeName?: string | null,
    prepMethodName?: string | null
): string {
    const unitStr = unit.hidden ? '' : `${unit.longSingular} of `;
    const sizeStr = sizeName ? `${sizeName} ` : '';
    const prepStr = prepMethodName ? `${prepMethodName} ` : '';
    return `1 ${unitStr}${sizeStr}${prepStr}${ingredientName}`;
}

export type GramsResult = { grams: number } | { grams: null; reason: string };

/**
 * Resolves a quantity to grams. Mass converts directly; volume and count go through the
 * ingredient's measures. A missing measure is the only reason a quantity fails.
 */
export function grams(
    qty: number,
    key: MeasureKey,
    measures: IngredientMeasureData[],
    labels: { ingredientName: string; sizeName?: string | null }
): GramsResult {
    if (key.unit.dimension === 'mass') {
        return { grams: qty * key.unit.perCanonical };
    }
    const found = findMeasure(measures, key);
    if (!found) {
        const one = describeOneUnit(key.unit, labels.ingredientName, labels.sizeName);
        return { grams: null, reason: `No weight recorded for ${one}` };
    }
    return { grams: qty * found.gramsPerUnit };
}

/**
 * Calculate the nutritional contribution of a single recipe ingredient.
 *
 * Every quantity reaches grams before it meets a macro:
 *  - no quantity          → not calculable
 *  - no nutritional data  → not calculable
 *  - grams(quantity, unit, measures) × perGram, or not calculable when no measure matches
 */
export function calculateIngredientNutrition(
    recipeIngredient: RecipeIngredientView,
    nutritionalInfo: NutritionalInfoData | null | undefined,
    measures: IngredientMeasureData[]
): CalculatedIngredientNutrition {
    if (!recipeIngredient.quantity) {
        return { calculable: false, macros: { ...ZERO_MACROS }, reason: 'No quantity' };
    }
    if (!nutritionalInfo) {
        return { calculable: false, macros: { ...ZERO_MACROS }, reason: 'No nutritional data' };
    }
    const qty = quantityToFloat(recipeIngredient.quantity);
    if (isNaN(qty)) {
        return {
            calculable: false,
            macros: { ...ZERO_MACROS },
            reason: 'Could not parse quantity',
        };
    }
    const unit = recipeIngredient.unit;
    if (!unit) {
        return { calculable: false, macros: { ...ZERO_MACROS }, reason: 'No unit' };
    }
    const ingredient = recipeIngredient.ingredient;
    const ingredientName = ingredient.__typename === 'Ingredient' ? ingredient.name : '';
    const key: MeasureKey = {
        unit,
        sizeId: recipeIngredient.size?._id ?? null,
        prepMethodId: recipeIngredient.prepMethod?._id ?? null,
    };
    const result = grams(qty, key, measures, {
        ingredientName,
        sizeName: recipeIngredient.size?.value,
    });
    if (result.grams === null) {
        return {
            calculable: false,
            macros: { ...ZERO_MACROS },
            reason: result.reason,
            missingMeasure: true,
        };
    }
    return { calculable: true, macros: scaleMacros(nutritionalInfo.perGram, result.grams) };
}

export interface UncountedIngredient {
    item: RecipeIngredientView;
    reason: string;
    /** True when recording a measure would let the line be counted. */
    missingMeasure: boolean;
}

/**
 * Sum the nutritional contributions of all recipe ingredients across all subsections.
 *
 * @param subsections - The ingredient subsections from the recipe.
 * @param nutritionalInfoMap - Map from ingredient _id to its NutritionalInfoData (or null if absent).
 * @param measuresMap - Map from ingredient _id to its measures.
 * @param numServings - The current number of servings (used to compute per-serving values).
 * @returns total macros for the whole recipe, per-serving macros, and the recipe ingredients
 *          that could not be included in the calculation.
 */
export function sumRecipeNutrition(
    subsections: IngredientSubsectionView[],
    nutritionalInfoMap: Map<string, NutritionalInfoData | null>,
    measuresMap: Map<string, IngredientMeasureData[]>,
    numServings: number
): {
    total: MacroNutrients;
    perServing: MacroNutrients;
    uncountedIds: Set<string>;
    uncounted: UncountedIngredient[];
} {
    let total: MacroNutrients = { ...ZERO_MACROS };
    const uncounted: UncountedIngredient[] = [];

    for (const subsection of subsections) {
        for (const item of subsection.ingredients) {
            if (item.ingredient.__typename !== 'Ingredient') {
                // Nested recipe-as-ingredient: skip (no nutritional data structure for these)
                continue;
            }
            const info = nutritionalInfoMap.get(item.ingredient._id) ?? null;
            const measures = measuresMap.get(item.ingredient._id) ?? [];
            const result = calculateIngredientNutrition(item, info, measures);
            if (result.calculable) {
                total = addMacros(total, result.macros);
            } else {
                uncounted.push({
                    item,
                    reason: result.reason ?? 'Not calculable',
                    missingMeasure: Boolean(result.missingMeasure),
                });
            }
        }
    }

    const divisor = numServings > 0 ? numServings : 1;
    const perServing: MacroNutrients = {
        calories: total.calories / divisor,
        protein: total.protein / divisor,
        carbs: total.carbs / divisor,
        fat: total.fat / divisor,
    };

    return {
        total,
        perServing,
        uncountedIds: new Set(uncounted.map((u) => u.item._id)),
        uncounted,
    };
}
