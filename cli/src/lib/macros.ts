import type { Macros, UsdaFoodItem } from './types.js';

/** Rounds away floating point noise without losing usable precision. */
export function round(value: number, decimals = 6): number {
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
}

/** Per-gram macros are the per-100 g values divided by 100. */
export function perGramFrom(item: UsdaFoodItem): Macros {
    return {
        calories: round((item.caloriesPer100g ?? 0) / 100),
        protein: round((item.proteinPer100g ?? 0) / 100),
        carbs: round((item.carbsPer100g ?? 0) / 100),
        fat: round((item.fatPer100g ?? 0) / 100),
    };
}

/** Names the macros the USDA record does not carry, so a zero is never silent. */
export function missingMacros(item: UsdaFoodItem): string[] {
    const missing: string[] = [];
    if (item.caloriesPer100g === null || item.caloriesPer100g === undefined)
        missing.push('calories');
    if (item.proteinPer100g === null || item.proteinPer100g === undefined) missing.push('protein');
    if (item.carbsPer100g === null || item.carbsPer100g === undefined) missing.push('carbs');
    if (item.fatPer100g === null || item.fatPer100g === undefined) missing.push('fat');
    return missing;
}

/** Exact arithmetic, once a portion has been chosen. */
export function scaleMacros(macros: Macros, factor: number): Macros {
    return {
        calories: round(macros.calories * factor),
        protein: round(macros.protein * factor),
        carbs: round(macros.carbs * factor),
        fat: round(macros.fat * factor),
    };
}

export function formatMacros(macros: Macros | null | undefined): string {
    if (!macros) return '(unset)';
    return `{ calories: ${macros.calories}, protein: ${macros.protein}, carbs: ${macros.carbs}, fat: ${macros.fat} }`;
}
