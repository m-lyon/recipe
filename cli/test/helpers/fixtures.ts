import type { UnitSummary, UsdaFoodItem } from '../../src/lib/types.js';

function unit(_id: string, name: string, extra: Partial<UnitSummary>): UnitSummary {
    return {
        __typename: 'Unit',
        _id,
        shortSingular: name,
        shortPlural: name,
        longSingular: name,
        longPlural: `${name}s`,
        dimension: 'count',
        perCanonical: 1,
        system: null,
        hidden: false,
        ...extra,
    } as UnitSummary;
}

export const EACH = unit('unit-each', 'each', { shortSingular: 'ea', hidden: true });
export const GRAM = unit('unit-g', 'gram', {
    shortSingular: 'g',
    dimension: 'mass',
    system: 'metric',
});
export const MILLILITRE = unit('unit-ml', 'millilitre', {
    shortSingular: 'ml',
    dimension: 'volume',
    system: 'metric',
});
export const TEASPOON = unit('unit-tsp', 'teaspoon', {
    shortSingular: 'tsp',
    dimension: 'volume',
    perCanonical: 4.92892159375,
    system: 'us',
});
export const TABLESPOON = unit('unit-tbsp', 'tablespoon', {
    shortSingular: 'tbsp',
    dimension: 'volume',
    perCanonical: 14.78676478125,
    system: 'us',
});
export const CUP = unit('unit-cup', 'cup', {
    dimension: 'volume',
    perCanonical: 236.5882365,
    system: 'us',
});
export const UNITS = [EACH, GRAM, MILLILITRE, TEASPOON, TABLESPOON, CUP];
export const LARGE = { _id: 'size-large', value: 'large' };
export const CHOPPED = { _id: 'prep-chopped', value: 'chopped' };
export const MEASURE_COMPONENTS = {
    units: UNITS,
    sizes: [LARGE],
    prepMethods: [CHOPPED],
};

/** Egg, whole, raw, fresh — five item sizes plus an ambiguous cup. */
export const EGG: UsdaFoodItem = {
    fdcId: 171287,
    description: 'Egg, whole, raw, fresh',
    dataType: 'SR Legacy',
    brandOwner: null,
    caloriesPer100g: 143,
    proteinPer100g: 12.56,
    carbsPer100g: 0.72,
    fatPer100g: 9.51,
    portions: [
        {
            description: '1 large',
            amount: 1,
            modifier: 'large',
            gramWeight: 50,
            kind: 'ITEM',
            millilitres: null,
            impliedDensity: null,
            ambiguous: false,
        },
        {
            description: '1 extra large',
            amount: 1,
            modifier: 'extra large',
            gramWeight: 56,
            kind: 'ITEM',
            millilitres: null,
            impliedDensity: null,
            ambiguous: false,
        },
        {
            description: '1 jumbo',
            amount: 1,
            modifier: 'jumbo',
            gramWeight: 63,
            kind: 'ITEM',
            millilitres: null,
            impliedDensity: null,
            ambiguous: false,
        },
        {
            description: '1 medium',
            amount: 1,
            modifier: 'medium',
            gramWeight: 44,
            kind: 'ITEM',
            millilitres: null,
            impliedDensity: null,
            ambiguous: false,
        },
        {
            description: '1 small',
            amount: 1,
            modifier: 'small',
            gramWeight: 38,
            kind: 'ITEM',
            millilitres: null,
            impliedDensity: null,
            ambiguous: false,
        },
        {
            description: '1 cup (4.86 large eggs)',
            amount: 1,
            modifier: 'cup (4.86 large eggs)',
            gramWeight: 243,
            kind: 'VOLUME',
            millilitres: 236.588,
            impliedDensity: 1.027,
            ambiguous: true,
        },
    ],
};

/** Oil, olive — volume portions only, so it has no item portion. */
export const OLIVE_OIL: UsdaFoodItem = {
    fdcId: 171413,
    description: 'Oil, olive, salad or cooking',
    dataType: 'SR Legacy',
    brandOwner: null,
    caloriesPer100g: 884,
    proteinPer100g: 0,
    carbsPer100g: 0,
    fatPer100g: 100,
    portions: [
        {
            description: '1 tablespoon',
            amount: 1,
            modifier: 'tablespoon',
            gramWeight: 13.5,
            kind: 'VOLUME',
            millilitres: 14.78676,
            impliedDensity: 0.9129795255887873,
            ambiguous: false,
        },
        {
            description: '1 cup',
            amount: 1,
            modifier: 'cup',
            gramWeight: 216,
            kind: 'VOLUME',
            millilitres: 236.588,
            impliedDensity: 0.9129795255887873,
            ambiguous: false,
        },
        {
            description: '1 tsp',
            amount: 1,
            modifier: 'tsp',
            gramWeight: 4.5,
            kind: 'VOLUME',
            millilitres: 4.92892,
            impliedDensity: 0.9129795255887873,
            ambiguous: false,
        },
    ],
};

/** Garlic, raw — a Foundation record whose only portion is a RACC. */
export const GARLIC: UsdaFoodItem = {
    fdcId: 1104647,
    description: 'Garlic, raw',
    dataType: 'Foundation',
    brandOwner: null,
    caloriesPer100g: 143,
    proteinPer100g: 6.62,
    carbsPer100g: 28.2,
    fatPer100g: 0.38,
    portions: [
        {
            description: '1 serving',
            amount: 1,
            modifier: null,
            gramWeight: 85,
            kind: 'SERVING',
            millilitres: null,
            impliedDensity: null,
            ambiguous: false,
        },
    ],
};

/** Flour — one volume portion qualified by a prep method. */
export const FLOUR: UsdaFoodItem = {
    fdcId: 168894,
    description: 'Wheat flour, white, all-purpose',
    dataType: 'SR Legacy',
    brandOwner: null,
    caloriesPer100g: 364,
    proteinPer100g: 10.33,
    carbsPer100g: 76.31,
    fatPer100g: 0.98,
    portions: [
        {
            description: '1 cup, chopped',
            amount: 1,
            modifier: 'cup, chopped',
            gramWeight: 125,
            kind: 'VOLUME',
            millilitres: 236.588,
            impliedDensity: 0.5283,
            ambiguous: true,
        },
    ],
};

export const INGREDIENTS = [
    {
        __typename: 'Ingredient',
        _id: 'ing-egg',
        name: 'egg',
        pluralName: 'eggs',
        isCountable: true,
        tags: [],
    },
    {
        __typename: 'Ingredient',
        _id: 'ing-oil',
        name: 'olive oil',
        pluralName: 'olive oils',
        isCountable: false,
        tags: [],
    },
    {
        __typename: 'Ingredient',
        _id: 'ing-flour',
        name: 'flour',
        pluralName: 'flours',
        isCountable: false,
        tags: [],
    },
    {
        __typename: 'Ingredient',
        _id: 'ing-garlic',
        name: 'garlic',
        pluralName: 'garlics',
        isCountable: true,
        tags: [],
    },
    {
        __typename: 'Ingredient',
        _id: 'ing-dup-a',
        name: 'stock',
        pluralName: 'stocks',
        isCountable: false,
        tags: [],
    },
    {
        __typename: 'Ingredient',
        _id: 'ing-dup-b',
        name: 'stock',
        pluralName: 'stocks',
        isCountable: false,
        tags: [],
    },
];

export const EXISTING_EGG_INFO = {
    __typename: 'NutritionalInfo',
    _id: 'nut-egg',
    ingredient: 'ing-egg',
    usdaFdcId: 171287,
    perGram: {
        __typename: 'MacroNutrients',
        calories: 1.43,
        protein: 0.1256,
        carbs: 0.0072,
        fat: 0.0951,
    },
};
