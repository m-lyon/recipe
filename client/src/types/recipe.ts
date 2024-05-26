import { GetPrepMethodsQuery } from '@recipe/graphql/generated';
import { EnumRecipeIngredientType, Unit } from '@recipe/graphql/generated';
import { GetIngredientsQuery, GetUnitsQuery } from '@recipe/graphql/generated';
import { Ingredient, IngredientCreate, PrepMethod } from '@recipe/graphql/generated';

export type Quantity = string | null;
export type EditableQuantity = Quantity;
export type FinishedQuantity = Quantity;
export interface EditableUnit {
    value: string | null;
    data?: Unit | null;
}
export type FinishedUnit = Unit | null;
export type Recipe = GetIngredientsQuery['recipeMany'][0];
export interface EditableIngredient {
    value: string | null;
    data?: Ingredient | Recipe;
}
export type FinishedIngredient = Ingredient | IngredientCreate | Recipe;
export interface EditablePrepMethod {
    value: string | null;
    data?: PrepMethod | null;
}
export type FinishedPrepMethod = PrepMethod | null;
export type InputState = 'quantity' | 'unit' | 'ingredient' | 'prepMethod';
export interface EditableRecipeIngredient {
    quantity: EditableQuantity;
    unit: EditableUnit;
    ingredient: EditableIngredient;
    prepMethod: EditablePrepMethod;
    state: InputState;
    show: boolean;
    key: string;
    type?: EnumRecipeIngredientType;
}
export interface FinishedRecipeIngredient {
    quantity: FinishedQuantity;
    unit: FinishedUnit;
    ingredient: FinishedIngredient;
    prepMethod: FinishedPrepMethod;
    key: string;
}
export type LikeFinishedRecipeIngredient = Omit<FinishedRecipeIngredient, 'key'>;
export interface RecipeIngredientQueryData {
    unit?: GetUnitsQuery['unitMany'];
    ingredient?: GetIngredientsQuery['ingredientMany'];
    recipe?: GetIngredientsQuery['recipeMany'];
    prepMethod?: GetPrepMethodsQuery['prepMethodMany'];
}
