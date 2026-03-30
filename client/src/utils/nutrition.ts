import { Fraction, fraction } from 'mathjs';

import { isFraction, isRange } from './number';

export interface MacroNutrients {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
}

export interface NutritionalInfoData {
    perGram?: MacroNutrients | null;
    perUnit?: MacroNutrients | null;
}

export interface CalculatedIngredientNutrition {
    calculable: boolean;
    macros: MacroNutrients;
    /** Human-readable explanation when not calculable */
    reason?: string;
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

/**
 * Convert a quantity in a given unit to grams using the UnitConversion data.
 * Returns null if the unit is not part of a mass UnitConversion group.
 */
function convertToGrams(quantity: number, unit: NonNullable<UnitView>, unitConversions: UnitConversion[]): number | null {
    const uc = unitConversions.find((conv) => conv.rules.some((rule) => rule.unit._id === unit._id));
    if (!uc) return null;
    if (uc.baseUnit.measureType !== 'mass') return null;
    const rule = uc.rules.find((r) => r.unit._id === unit._id);
    if (!rule) return null;
    return quantity * rule.baseToUnitConversion;
}

/**
 * Convert a quantity in a given unit to millilitres using the UnitConversion data.
 * Returns null if the unit is not part of a volume UnitConversion group.
 */
function convertToMl(quantity: number, unit: NonNullable<UnitView>, unitConversions: UnitConversion[]): number | null {
    const uc = unitConversions.find((conv) => conv.rules.some((rule) => rule.unit._id === unit._id));
    if (!uc) return null;
    if (uc.baseUnit.measureType !== 'volume') return null;
    const rule = uc.rules.find((r) => r.unit._id === unit._id);
    if (!rule) return null;
    return quantity * rule.baseToUnitConversion;
}

/**
 * Calculate the nutritional contribution of a single recipe ingredient.
 *
 * Pipeline selection (matches the backend notification logic):
 *  - no quantity           → not calculable
 *  - no nutritional data   → not calculable
 *  - no unit + perUnit     → quantity × perUnit
 *  - mass unit + perGram   → convertToGrams(quantity, unit) × perGram
 *  - volume unit + density + perGram → convertToMl → × density → × perGram
 *  - anything else         → not calculable
 */
export function calculateIngredientNutrition(
    recipeIngredient: RecipeIngredientView,
    nutritionalInfo: NutritionalInfoData | null | undefined,
    unitConversions: UnitConversion[]
): CalculatedIngredientNutrition {
    if (!recipeIngredient.quantity) {
        return { calculable: false, macros: { ...ZERO_MACROS }, reason: 'No quantity' };
    }
    if (!nutritionalInfo) {
        return { calculable: false, macros: { ...ZERO_MACROS }, reason: 'No nutritional data' };
    }

    const qty = quantityToFloat(recipeIngredient.quantity);
    if (isNaN(qty)) {
        return { calculable: false, macros: { ...ZERO_MACROS }, reason: 'Could not parse quantity' };
    }
    const unit = recipeIngredient.unit;

    // Case 1: No unit → countable ingredient
    if (!unit) {
        if (!nutritionalInfo.perUnit) {
            return { calculable: false, macros: { ...ZERO_MACROS }, reason: 'No per-unit nutritional data' };
        }
        return { calculable: true, macros: scaleMacros(nutritionalInfo.perUnit, qty) };
    }

    if (!nutritionalInfo.perGram) {
        return { calculable: false, macros: { ...ZERO_MACROS }, reason: 'No per-gram nutritional data' };
    }

    // Case 2: Mass unit
    if (unit.measureType === 'mass') {
        const grams = convertToGrams(qty, unit, unitConversions);
        if (grams === null) {
            return { calculable: false, macros: { ...ZERO_MACROS }, reason: 'Cannot convert unit to grams' };
        }
        return { calculable: true, macros: scaleMacros(nutritionalInfo.perGram, grams) };
    }

    // Case 3: Volume unit
    if (unit.measureType === 'volume') {
        const ml = convertToMl(qty, unit, unitConversions);
        if (ml === null) {
            return { calculable: false, macros: { ...ZERO_MACROS }, reason: 'Cannot convert unit to ml' };
        }
        const ingredient = recipeIngredient.ingredient;
        if (ingredient.__typename !== 'Ingredient' || !ingredient.density) {
            return {
                calculable: false,
                macros: { ...ZERO_MACROS },
                reason: 'No density set for volume-measured ingredient',
            };
        }
        const grams = ml * ingredient.density;
        return { calculable: true, macros: scaleMacros(nutritionalInfo.perGram, grams) };
    }

    return {
        calculable: false,
        macros: { ...ZERO_MACROS },
        reason: `Unit "${unit.shortSingular}" has no measure type set`,
    };
}

/**
 * Sum the nutritional contributions of all recipe ingredients across all subsections.
 *
 * @param subsections - The ingredient subsections from the recipe.
 * @param nutritionalInfoMap - Map from ingredient _id to its NutritionalInfoData (or null if absent).
 * @param unitConversions - The raw unit conversion data from the API.
 * @param numServings - The current number of servings (used to compute per-serving values).
 * @returns total macros for the whole recipe, per-serving macros, and a set of recipe ingredient
 *          _ids that could not be included in the calculation.
 */
export function sumRecipeNutrition(
    subsections: IngredientSubsectionView[],
    nutritionalInfoMap: Map<string, NutritionalInfoData | null>,
    unitConversions: UnitConversion[],
    numServings: number
): { total: MacroNutrients; perServing: MacroNutrients; uncountedIds: Set<string> } {
    let total: MacroNutrients = { ...ZERO_MACROS };
    const uncountedIds = new Set<string>();

    for (const subsection of subsections) {
        for (const item of subsection.ingredients) {
            if (item.ingredient.__typename !== 'Ingredient') {
                // Nested recipe-as-ingredient: skip (no nutritional data structure for these)
                continue;
            }
            const info = nutritionalInfoMap.get(item.ingredient._id) ?? null;
            const result = calculateIngredientNutrition(item, info, unitConversions);
            if (result.calculable) {
                total = addMacros(total, result.macros);
            } else {
                uncountedIds.add(item._id);
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

    return { total, perServing, uncountedIds };
}
