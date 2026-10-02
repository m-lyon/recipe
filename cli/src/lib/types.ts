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
    density?: number | null;
    tags?: string[] | null;
}

export interface NutritionalInfoSummary {
    _id: string;
    ingredient: string;
    usdaFdcId?: number | null;
    perGram?: Macros | null;
    perUnit?: Macros | null;
}

export interface UnitSummary {
    _id: string;
    shortSingular: string;
    measureType?: string | null;
}

export interface RecipeIngredientSummary {
    _id?: string | null;
    quantity?: string | null;
    unit?: UnitSummary | null;
    size?: { _id: string; value: string } | null;
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
