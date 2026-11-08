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

/** The quantities the API accepts: "2", "1.5", "1/2" or a range such as "1-2". */
const QUANTITY = /^((\d+(\.\d+)?|[1-9]\d*\/[1-9]\d*)(-(\d+(\.\d+)?|[1-9]\d*\/[1-9]\d*))?)$/;

export function isValidQuantity(quantity: string): boolean {
    return QUANTITY.test(quantity.trim());
}
