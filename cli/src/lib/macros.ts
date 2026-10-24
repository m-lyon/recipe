import type { Macros, Per100g } from './types.js';

/** Rounds away floating point noise without losing usable precision. */
export function round(value: number, decimals = 6): number {
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
}

/** Per-gram macros are the per-100 g values divided by 100. */
export function perGramFrom(item: Per100g): Macros {
    return {
        calories: round((item.caloriesPer100g ?? 0) / 100),
        protein: round((item.proteinPer100g ?? 0) / 100),
        carbs: round((item.carbsPer100g ?? 0) / 100),
        fat: round((item.fatPer100g ?? 0) / 100),
    };
}

/** Names the macros the record does not carry, so a zero is never silent. */
export function missingMacros(item: Per100g): string[] {
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

/**
 * Macros per 100 g from a pack label, given as "kcal,protein,carbs,fat".
 * Returns null for anything that is not four non-negative numbers.
 */
export function parseLabelPer100g(text: string): Required<Per100g> | null {
    const values = text.split(',').map((part) => part.trim());
    if (values.length !== 4 || values.some((value) => !/^\d+(\.\d+)?$/.test(value))) {
        return null;
    }
    const [calories, protein, carbs, fat] = values.map(Number);
    return {
        caloriesPer100g: calories,
        proteinPer100g: protein,
        carbsPer100g: carbs,
        fatPer100g: fat,
    };
}

/** The gap allowed between label kcal and 4·P + 4·C + 9·F, as the API allows it. EU
 *  labels count fibre at 2 kcal and leave it out of carbs, so a small gap is normal. */
const KCAL_TOLERANCE_ABSOLUTE = 20;
const KCAL_TOLERANCE_RELATIVE = 0.2;

/** A kcal that the macros do not explain usually means a value typed in the wrong place. */
export function kcalMismatch(values: Required<Per100g>): string | null {
    const kcal = values.caloriesPer100g!;
    const fromMacros =
        4 * values.proteinPer100g! + 4 * values.carbsPer100g! + 9 * values.fatPer100g!;
    const tolerance = Math.max(KCAL_TOLERANCE_ABSOLUTE, KCAL_TOLERANCE_RELATIVE * kcal);
    if (Math.abs(kcal - fromMacros) <= tolerance) return null;
    return `${kcal} kcal does not match the macros (about ${Math.round(fromMacros)} kcal)`;
}
