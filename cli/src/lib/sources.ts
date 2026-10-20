import { EMPTY } from './format.js';
import type { NutritionalInfoSummary, OpenFoodFactsProduct } from './types.js';

export const UK_COUNTRY_TAG = 'en:united-kingdom';

/**
 * Whether the last digit of a GTIN (EAN-8, UPC-A, EAN-13, GTIN-14) matches the
 * others. A failure usually means a misread or mistyped digit, but Open Food
 * Facts also holds store codes that fail it, so a caller warns rather than
 * refuses.
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

/** "Al'fez · Pearl Couscous", or the barcode alone when the product has no name. */
export function openFoodFactsProductName(
    product: Pick<OpenFoodFactsProduct, 'barcode' | 'name' | 'brands'>
): string {
    const parts = [product.brands, product.name].filter((part): part is string => Boolean(part));
    return parts.length > 0 ? parts.join(' · ') : product.barcode;
}

export function isUkProduct(product: Pick<OpenFoodFactsProduct, 'countries'>): boolean {
    return product.countries.includes(UK_COUNTRY_TAG);
}

/** "USDA 171413", "Open Food Facts 5010338301255" or "manual": where the values came from. */
export function describeSource(
    info: Pick<NutritionalInfoSummary, 'source' | 'usdaFdcId' | 'openFoodFactsBarcode'>
): string {
    if (info.source === 'openFoodFacts' || (!info.source && info.openFoodFactsBarcode)) {
        return `Open Food Facts ${info.openFoodFactsBarcode ?? EMPTY}`;
    }
    if (info.source === 'usda' || (!info.source && info.usdaFdcId)) {
        return `USDA ${info.usdaFdcId ?? EMPTY}`;
    }
    return 'manual';
}
