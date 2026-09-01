import { GraphQLError } from 'graphql';
import { schemaComposer } from 'graphql-compose';

import { USDA_API_KEY } from '../constants.js';

const USDA_BASE = 'https://api.nal.usda.gov/fdc/v1';
const USDA_REQUEST_TIMEOUT_MS = 10_000;
const USDA_MAX_PAGE_SIZE = 200;

const VOLUME_ML: Record<string, number> = {
    ml: 1,
    millilitre: 1,
    milliliter: 1,
    l: 1000,
    litre: 1000,
    liter: 1000,
    tsp: 4.92892,
    teaspoon: 4.92892,
    tbsp: 14.78676,
    tablespoon: 14.78676,
    'fl oz': 29.5735,
    'fluid ounce': 29.5735,
    cup: 236.588,
    pint: 473.176,
    quart: 946.353,
    gallon: 3785.41,
};

const MASS_UNITS = new Set([
    'g',
    'gram',
    'kg',
    'kilogram',
    'mg',
    'milligram',
    'oz',
    'ounce',
    'lb',
    'pound',
]);

type PortionKind = 'ITEM' | 'VOLUME' | 'WEIGHT' | 'SERVING';

export interface MappedPortion {
    description: string;
    amount: number | null;
    modifier: string | null;
    gramWeight: number;
    kind: PortionKind;
    millilitres: number | null;
    impliedDensity: number | null;
    ambiguous: boolean;
}

schemaComposer.createEnumTC({
    name: 'UsdaPortionKind',
    values: {
        // One countable thing: "1 large", "1 clove", "1 slice". Usable for perUnit.
        ITEM: { value: 'ITEM' },
        // Maps to a volume unit: "1 cup", "1 tbsp". Usable for density, never perUnit.
        VOLUME: { value: 'VOLUME' },
        // Maps to a mass unit: "1 oz". Redundant with perGram; offer for neither.
        WEIGHT: { value: 'WEIGHT' },
        // Branded servingSize fallback, or a RACC. A serving is not necessarily one item.
        SERVING: { value: 'SERVING' },
    },
});

const UsdaFoodPortionTC = schemaComposer.createObjectTC({
    name: 'UsdaFoodPortion',
    fields: {
        // Human-readable label, e.g. "1 large" or "1 cup"
        description: 'String!',
        amount: 'Float',
        modifier: 'String',
        gramWeight: 'Float!',
        // What the portion measures. Only ITEM portions may be used to
        // derive perUnit; only VOLUME portions can imply a density.
        kind: 'UsdaPortionKind!',
        // Non-null only when `modifier` maps to a known volume unit
        millilitres: 'Float',
        // gramWeight / millilitres, when millilitres is known
        impliedDensity: 'Float',
        // True when the modifier carries a qualifier that makes the portion
        // unreliable for its kind: a packing density rather than a true
        // density, or a count that is not one whole item.
        // e.g. "cup, chopped" or "cup (4.86 large eggs)".
        ambiguous: 'Boolean!',
    },
});

const UsdaFoodItemTC = schemaComposer.createObjectTC({
    name: 'UsdaFoodItem',
    fields: {
        fdcId: 'Int!',
        description: 'String!',
        // "Foundation", "SR Legacy", "Branded", "Survey (FNDDS)". Generic
        // ingredients should prefer Foundation and SR Legacy over Branded.
        dataType: 'String',
        brandOwner: 'String',
        caloriesPer100g: 'Float',
        proteinPer100g: 'Float',
        carbsPer100g: 'Float',
        fatPer100g: 'Float',
        portions: {
            type: UsdaFoodPortionTC.NonNull.List.NonNull,
            description: 'Named portions with gram weights',
        },
        servingSize: 'Float',
        servingSizeUnit: 'String',
        householdServingFullText: 'String',
    },
});

/** Strips a trailing qualifier so "cup, chopped" and "cup (4.86 large eggs)" both
 *  resolve their leading unit.*/
function unitToken(label: string): string {
    return label.toLowerCase().split(/[,(]/)[0].trim().replace(/\.$/, '');
}

/** Millilitres for one of a free-text portion unit, or null when it is not a volume. */
function volumeMlPerUnit(label: string | null): number | null {
    if (!label) return null;
    const token = unitToken(label);
    if (token in VOLUME_ML) return VOLUME_ML[token];
    const singular = token.replace(/s$/, '');
    if (singular in VOLUME_ML) return VOLUME_ML[singular];
    return null;
}

function isMassUnit(label: string | null): boolean {
    if (!label) return false;
    const token = unitToken(label);
    return MASS_UNITS.has(token) || MASS_UNITS.has(token.replace(/s$/, ''));
}

/** Classification rules, applied in order.*/
function classifyPortion(
    label: string | null,
    measureUnitName: string | null,
    fromServingSize: boolean
): PortionKind {
    // 1. Reference Amount Customarily Consumed (RACC) is the average amount of a food
    // or beverage that people realistically eat or drink in a single session.
    if (measureUnitName === 'RACC') return 'SERVING';
    // 2. Nothing can be claimed about an unlabelled portion; likely to be RACC.
    if (!label || !label.trim()) return 'SERVING';
    // 3. FNDDS (Survey) records use this exact text as a catch-all row when no
    // measure applies. Like a RACC, it is not one item.
    if (label.trim().toLowerCase() === 'quantity not specified') return 'SERVING';
    // 4. Built from the Branded servingSize fallback.
    if (fromServingSize) return 'SERVING';
    // 5. A known volume unit.
    if (volumeMlPerUnit(label) != null) return 'VOLUME';
    // 6. A known mass unit.
    if (isMassUnit(label)) return 'WEIGHT';
    // 7. Otherwise a countable item.
    return 'ITEM';
}

/** FNDDS (Survey) foodPortions put an internal numeric portion code in `modifier`
 *  (e.g. "60482") instead of a human-readable unit like "large" or "cup". It carries
 *  no meaning as a label, so it must not reach description building or classification. */
function isNumericCode(value: string): boolean {
    return /^\d+$/.test(value.trim());
}

/** Independent of kind: flags a portion whose label or amount makes it unreliable. */
function isAmbiguous(label: string | null, amount: number | null): boolean {
    if (amount != null && amount !== 1) return true;
    if (!label) return false;
    const lower = label.toLowerCase();
    if (lower.includes(',') || lower.includes('(') || lower.includes(')')) return true;
    // "1 lemon yields" is juice output, not a lemon.
    if (lower.includes('yields')) return true;
    // "NLEA serving" counts like an item but is a labelling serving size.
    if (lower.includes('serving')) return true;
    // A slice is a real item, but it sits beside whole-item sizes and is a common
    // mis-pick. Flag it rather than hide it.
    if (lower.includes('slice')) return true;
    return false;
}

function formatAmount(amount: number | null): string {
    // String(1.0) is "1", so USDA's float amounts already render cleanly.
    return String(amount ?? 1);
}

function buildDescription(
    amount: number | null,
    modifier: string | null,
    portionDescription: string | null,
    measureUnitName: string | null
): string {
    if (modifier) return `${formatAmount(amount)} ${modifier}`;
    if (portionDescription) return portionDescription;
    if (measureUnitName && measureUnitName !== 'undetermined') {
        return `${formatAmount(amount)} ${measureUnitName}`;
    }
    return `${formatAmount(amount)} serving`;
}

function asNumber(value: unknown): number | null {
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function asString(value: unknown): string | null {
    return typeof value === 'string' && value.length > 0 ? value : null;
}

function buildPortion(
    amount: number | null,
    modifier: string | null,
    portionDescription: string | null,
    measureUnitName: string | null,
    gramWeight: number,
    fromServingSize: boolean
): MappedPortion {
    // A numeric modifier (FNDDS survey code) is not a usable label; fall back to
    // portionDescription, which carries the real text ("1 can").
    const usableModifier = modifier && !isNumericCode(modifier) ? modifier : null;
    const label = usableModifier ?? portionDescription;
    const kind = classifyPortion(label, measureUnitName, fromServingSize);
    // Only a VOLUME portion carries volume information. A RACC or a branded serving
    // that happens to name a cup is a serving size, not a measured volume.
    const mlPerUnit = kind === 'VOLUME' ? volumeMlPerUnit(label) : null;
    const millilitres = mlPerUnit == null ? null : mlPerUnit * (amount ?? 1);
    return {
        description: buildDescription(amount, usableModifier, portionDescription, measureUnitName),
        amount,
        modifier,
        gramWeight,
        kind,
        millilitres,
        impliedDensity: millilitres ? gramWeight / millilitres : null,
        ambiguous: isAmbiguous(label, amount),
    };
}

/** Maps foodPortions, falling back to the Branded servingSize shape. Returns [] when
 *  the item carries no portion data at all -- the normal case for search results. */
export function mapPortions(item: Record<string, unknown>): MappedPortion[] {
    const raw = item['foodPortions'];
    if (Array.isArray(raw) && raw.length > 0) {
        const entries = raw as Array<Record<string, unknown>>;
        return entries
            .map((entry, index) => ({ entry, index }))
            .sort((a, b) => {
                const seqA = asNumber(a.entry['sequenceNumber']) ?? Number.MAX_SAFE_INTEGER;
                const seqB = asNumber(b.entry['sequenceNumber']) ?? Number.MAX_SAFE_INTEGER;
                return seqA === seqB ? a.index - b.index : seqA - seqB;
            })
            .map(({ entry }) => {
                const measureUnit = entry['measureUnit'] as Record<string, unknown> | undefined;
                return buildPortion(
                    asNumber(entry['amount']),
                    asString(entry['modifier']),
                    asString(entry['portionDescription']),
                    asString(measureUnit?.['name']),
                    asNumber(entry['gramWeight']) ?? 0,
                    false
                );
            })
            .filter((portion) => portion.gramWeight > 0);
    }

    // Branded items have no foodPortions. They carry a single serving size instead.
    // Only a gram-denominated serving yields a usable gramWeight.
    const servingSize = asNumber(item['servingSize']);
    const servingSizeUnit = asString(item['servingSizeUnit']);
    if (servingSize == null || servingSize <= 0) return [];
    if (!servingSizeUnit || !['g', 'gram', 'grams'].includes(servingSizeUnit.toLowerCase())) {
        return [];
    }
    const household = asString(item['householdServingFullText']);
    return [
        buildPortion(
            1,
            null,
            household ?? `${servingSize} ${servingSizeUnit}`,
            null,
            servingSize,
            true
        ),
    ];
}

function extractNutrient(
    foodNutrients: Array<Record<string, unknown>>,
    nutrientId: number
): number | null {
    const entry = foodNutrients?.find(
        (n) =>
            n['nutrientId'] === nutrientId ||
            (n['nutrient'] as Record<string, unknown>)?.['id'] === nutrientId
    );
    if (!entry) return null;
    const value = entry['value'] ?? entry['amount'];
    return typeof value === 'number' ? value : null;
}

// USDA nutrient IDs: Energy=1008, Protein=1003, Carbs=1005, Fat=1004
function mapFoodItem(item: Record<string, unknown>) {
    const nutrients = (item['foodNutrients'] as Array<Record<string, unknown>>) ?? [];
    return {
        fdcId: item['fdcId'],
        description: item['description'],
        dataType: asString(item['dataType']),
        brandOwner: item['brandOwner'] ?? null,
        caloriesPer100g: extractNutrient(nutrients, 1008),
        proteinPer100g: extractNutrient(nutrients, 1003),
        carbsPer100g: extractNutrient(nutrients, 1005),
        fatPer100g: extractNutrient(nutrients, 1004),
        portions: mapPortions(item),
        servingSize: asNumber(item['servingSize']),
        servingSizeUnit: asString(item['servingSizeUnit']),
        householdServingFullText: asString(item['householdServingFullText']),
    };
}

function usdaFetch(url: string): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), USDA_REQUEST_TIMEOUT_MS);
    return fetch(url, {
        headers: { 'X-Api-Key': USDA_API_KEY },
        signal: controller.signal,
    }).finally(() => clearTimeout(timer));
}

export const UsdaQuery = {
    usdaSearch: schemaComposer.createResolver({
        name: 'usdaSearch',
        type: [UsdaFoodItemTC],
        args: { query: 'String!', pageSize: { type: 'Int', defaultValue: 20 } },
        resolve: async ({ args, context }) => {
            if (!context.getUser()) throw new GraphQLError('Not authenticated');
            if (typeof args.query !== 'string' || !args.query) {
                throw new GraphQLError('Invalid query argument', {
                    extensions: { code: 'BAD_USER_INPUT' },
                });
            }
            const safePageSize = Math.min((args.pageSize as number) ?? 20, USDA_MAX_PAGE_SIZE);
            const url = `${USDA_BASE}/foods/search?query=${encodeURIComponent(args.query)}&pageSize=${safePageSize}`;
            const res = await usdaFetch(url);
            if (!res.ok) {
                throw new GraphQLError(`USDA API error: ${res.status} ${res.statusText}`);
            }
            const json = (await res.json()) as Record<string, unknown>;
            return ((json['foods'] as Array<Record<string, unknown>>) ?? []).map(mapFoodItem);
        },
    }),
    usdaFoodItem: schemaComposer.createResolver({
        name: 'usdaFoodItem',
        type: UsdaFoodItemTC,
        args: { fdcId: 'Int!' },
        resolve: async ({ args, context }) => {
            if (!context.getUser()) throw new GraphQLError('Not authenticated');
            // format=full, not abridged: abridged omits foodPortions entirely.
            const url = `${USDA_BASE}/food/${args.fdcId}?format=full`;
            const res = await usdaFetch(url);
            if (!res.ok) {
                throw new GraphQLError(`USDA API error: ${res.status} ${res.statusText}`);
            }
            const json = (await res.json()) as Record<string, unknown>;
            if (!json['fdcId']) {
                throw new GraphQLError('Food item not found', {
                    extensions: { code: 'NOT_FOUND' },
                });
            }
            return mapFoodItem(json);
        },
    }),
};

export const __testables = { VOLUME_ML };
