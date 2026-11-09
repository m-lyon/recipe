import { VALID_NUMBER_REGEX, isRange, validateRange } from './number';
import { getFinishedQuantityStr, unitDisplayValue } from './formatting';

/** "15% of it", "¼ tsp" or "none, too small to count": what the nutrition counts of a line. */
export function describeNutritionOverride(override: NutritionOverride): string {
    switch (override.mode) {
        case 'share':
            return `${override.percent ?? 0}% of it`;
        case 'amount': {
            const quantity = override.quantity ?? '';
            const unit = override.unit;
            const shown = getFinishedQuantityStr(quantity);
            if (!unit || unit.hidden) return shown;
            return `${shown}${unit.hasSpace ? ' ' : ''}${unitDisplayValue(quantity, unit, true)}`;
        }
        case 'negligible':
            return 'none, too small to count';
    }
}

export function submittableNutritionOverride(
    override: NutritionOverride | null
): SubmittableNutritionOverride | undefined {
    if (!override) return undefined;
    switch (override.mode) {
        case 'share':
            return { mode: 'share', percent: override.percent ?? 0 };
        case 'amount':
            return {
                mode: 'amount',
                quantity: override.quantity ?? undefined,
                unit: override.unit?._id,
            };
        case 'negligible':
            return { mode: 'negligible' };
    }
}

export function isValidQuantity(quantity: string): boolean {
    const trimmed = quantity.trim();
    if (!VALID_NUMBER_REGEX.test(trimmed)) return false;
    return !isRange(trimmed) || validateRange(trimmed);
}
