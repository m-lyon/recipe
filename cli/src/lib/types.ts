/**
 * Structural shapes for the data the commands pass around.
 *
 * These deliberately mirror the generated GraphQL types rather than importing
 * them, so the formatting and nutrition helpers stay testable without a
 * generated schema and without a live API.
 */

export interface Macros {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
}

export interface IngredientSummary {
    _id: string;
    name: string;
    pluralName: string;
    isCountable: boolean;
    tags?: string[] | null;
}

export type NutritionSource = 'usda' | 'openFoodFacts' | 'manual';

export interface NutritionalInfoSummary {
    _id: string;
    ingredient: string;
    /** Set on the record for a prep method that changes the food: lime, juiced. */
    prepMethod?: NamedSummary | null;
    source?: NutritionSource | null;
    usdaFdcId?: number | null;
    openFoodFactsBarcode?: string | null;
    /** The food or product name, stored when the link was made. */
    sourceName?: string | null;
    perGram?: Macros | null;
}

export interface UnitSummary {
    _id: string;
    shortSingular: string;
    shortPlural?: string;
    longSingular: string;
    longPlural?: string;
    dimension: 'mass' | 'volume' | 'count';
    perCanonical: number;
    system?: 'metric' | 'us' | null;
    hidden?: boolean;
    /** The key of a standard unit, such as each. Null for other units. */
    standard?: string | null;
}

export interface NamedSummary {
    _id: string;
    value: string;
}

/** The weight of one of `unit` of an ingredient, optionally narrowed by size and prep. */
export interface MeasureSummary {
    _id: string;
    ingredient: string;
    grams: number;
    unit: UnitSummary;
    size?: NamedSummary | null;
    prepMethod?: NamedSummary | null;
}

export interface RecipeIngredientSummary {
    _id?: string | null;
    quantity?: string | null;
    unit?: UnitSummary | null;
    size?: NamedSummary | null;
    prepMethod?: NamedSummary | null;
    ingredient:
        | ({ __typename: 'Ingredient' } & IngredientSummary)
        | { __typename: 'Recipe'; _id: string; title: string };
}

export interface RecipeSummary {
    _id: string;
    title: string;
    titleIdentifier: string;
    isIngredient?: boolean | null;
    archived?: boolean | null;
}

export interface RecipeDetail extends RecipeSummary {
    ingredientSubsections: Array<{
        name?: string | null;
        ingredients: RecipeIngredientSummary[];
    }>;
}

export const PortionKind = {
    Item: 'ITEM',
    Volume: 'VOLUME',
    Weight: 'WEIGHT',
    Serving: 'SERVING',
} as const;
export type PortionKind = (typeof PortionKind)[keyof typeof PortionKind];

export interface UsdaPortion {
    description: string;
    amount?: number | null;
    modifier?: string | null;
    gramWeight: number;
    kind: PortionKind;
    millilitres?: number | null;
    impliedDensity?: number | null;
    ambiguous: boolean;
}

/** Macros per 100 g, as both sources report them. */
export interface Per100g {
    caloriesPer100g?: number | null;
    proteinPer100g?: number | null;
    carbsPer100g?: number | null;
    fatPer100g?: number | null;
}

export interface OpenFoodFactsProduct extends Per100g {
    barcode: string;
    name?: string | null;
    brands?: string | null;
    quantity?: string | null;
    servingSize?: string | null;
    countries: string[];
    /** Data problems: a missing macro, or kcal that the macros do not explain. */
    warnings: string[];
    portions?: UsdaPortion[];
}

export interface UsdaFoodItem {
    fdcId: number;
    description: string;
    dataType?: string | null;
    brandOwner?: string | null;
    caloriesPer100g?: number | null;
    proteinPer100g?: number | null;
    carbsPer100g?: number | null;
    fatPer100g?: number | null;
    servingSize?: number | null;
    servingSizeUnit?: string | null;
    householdServingFullText?: string | null;
    portions?: UsdaPortion[];
}
