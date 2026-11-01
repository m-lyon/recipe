/** Values per 100 g (or per 100 ml), as a label or a database gives them. */
export interface Per100 {
    calories: number | null | undefined;
    protein: number | null | undefined;
    carbs: number | null | undefined;
    fat: number | null | undefined;
}

/** A measure row as the measures list holds it, saved or staged. */
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

/** "52 kcal · 0.3 g protein · 14 g carbs · 0.2 g fat per 100 g". */
export function formatPer100(values: Per100, per: '100 g' | '100 ml' = '100 g'): string {
    return (
        `${round1(values.calories)} kcal · ${round1(values.protein)} g protein · ` +
        `${round1(values.carbs)} g carbs · ${round1(values.fat)} g fat per ${per}`
    );
}

/** Per-gram macros are the per-100 g values divided by 100. A missing value counts as 0. */
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

/** A kcal that the macros do not explain usually means a value typed in the wrong place.
 *  The same rule as `kcalMismatch` in the CLI. */
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

/**
 * Whether the last digit of a GTIN (EAN-8, UPC-A, EAN-13, GTIN-14) matches the others.
 * A failure usually means a mistyped digit.
 */
export function hasValidCheckDigit(barcode: string): boolean {
    if (!/^\d{8,14}$/.test(barcode)) return false;
    const digits = [...barcode].map(Number);
    const check = digits.pop()!;
    // From the right, the data digits weigh 3, 1, 3, 1...
    const sum = digits
        .reverse()
        .reduce((total, digit, index) => total + digit * (index % 2 === 0 ? 3 : 1), 0);
    return (10 - (sum % 10)) % 10 === check;
}

/** "Al'fez · Pearl Couscous", or the barcode alone, as the CLI names the record. */
export function openFoodFactsProductName(product: {
    barcode: string;
    name?: string | null;
    brands?: string | null;
}): string {
    const parts = [product.brands, product.name].filter((part): part is string => Boolean(part));
    return parts.length > 0 ? parts.join(' · ') : product.barcode;
}

/** The product page, which also gives the ODbL attribution. */
export function openFoodFactsUrl(barcode: string): string {
    return `https://world.openfoodfacts.org/product/${barcode}`;
}

/**
 * Grams per millilitre, from a volume measure with no size and the same prep method. The
 * same rule as `recipe nutrition set --per-100ml`: a density is never guessed.
 */
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
