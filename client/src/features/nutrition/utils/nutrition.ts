export interface Per100 {
    calories: number | null | undefined;
    protein: number | null | undefined;
    carbs: number | null | undefined;
    fat: number | null | undefined;
}

export interface MeasureForDensity {
    unit: { dimension: string; perCanonical: number };
    sizeId: string | null;
    prepMethodId: string | null;
    grams: number;
}

function round1(n: number | null | undefined): string {
    if (n == null) return '—';
    return n.toFixed(1).replace(/\.0$/, '');
}

export function formatPer100(values: Per100, per: '100 g' | '100 ml' = '100 g'): string {
    return (
        `${round1(values.calories)} kcal · ${round1(values.protein)} g protein · ` +
        `${round1(values.carbs)} g carbs · ${round1(values.fat)} g fat per ${per}`
    );
}

export function perGramFrom(values: Per100): MacroNutrients {
    return {
        calories: (values.calories ?? 0) / 100,
        protein: (values.protein ?? 0) / 100,
        carbs: (values.carbs ?? 0) / 100,
        fat: (values.fat ?? 0) / 100,
    };
}

/** The gap allowed between label kcal and 4·P + 4·C + 9·F, as the API and CLI allow it. EU
 *  labels count fibre at 2 kcal and leave it out of carbs, so a small gap is normal. */
const KCAL_TOLERANCE_ABSOLUTE = 20;
const KCAL_TOLERANCE_RELATIVE = 0.2;

export function kcalMismatch(values: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
}): string | null {
    const fromMacros = 4 * values.protein + 4 * values.carbs + 9 * values.fat;
    const tolerance = Math.max(KCAL_TOLERANCE_ABSOLUTE, KCAL_TOLERANCE_RELATIVE * values.calories);
    if (Math.abs(values.calories - fromMacros) <= tolerance) return null;
    return (
        `${values.calories} kcal does not match the macros ` +
        `(about ${Math.round(fromMacros)} kcal)`
    );
}

export function hasValidCheckDigit(barcode: string): boolean {
    if (!/^\d{8,14}$/.test(barcode)) return false;
    const digits = [...barcode].map(Number);
    const check = digits.pop()!;
    const sum = digits
        .reverse()
        .reduce((total, digit, index) => total + digit * (index % 2 === 0 ? 3 : 1), 0);
    return (10 - (sum % 10)) % 10 === check;
}

export function openFoodFactsProductName(product: {
    barcode: string;
    name?: string | null;
    brands?: string | null;
}): string {
    const parts = [product.brands, product.name].filter((part): part is string => Boolean(part));
    return parts.length > 0 ? parts.join(' · ') : product.barcode;
}

export function openFoodFactsUrl(barcode: string): string {
    return `https://world.openfoodfacts.org/product/${barcode}`;
}

export function gramsPerMillilitre(
    measures: MeasureForDensity[],
    prepMethodId: string | null
): number | null {
    const measure = measures.find(
        (m) => m.unit.dimension === 'volume' && !m.sizeId && m.prepMethodId === prepMethodId
    );
    if (!measure) return null;
    // A volume unit's perCanonical is its size in millilitres.
    return measure.grams / measure.unit.perCanonical;
}
