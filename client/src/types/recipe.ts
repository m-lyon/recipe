import { Ingredient, PrepMethod, Recipe } from '@recipe/graphql/generated';
import { GetIngredientsQuery, GetUnitsQuery } from '@recipe/graphql/generated';
import { EnumRecipeIngredientType, RecipeIngredient, Unit } from '@recipe/graphql/generated';
import { GetPrepMethodsQuery, GetRecipeQuery, GetRecipesQuery } from '@recipe/graphql/generated';

export type Quantity = string | null;
export type EditableQuantity = Quantity;
export type FinishedQuantity = Quantity;
export interface EditableUnit {
    value: string | null;
    data?: Unit | null;
}
export type FinishedUnit = Unit | null;
export type RecipeFromOne = GetRecipeQuery['recipeOne'];
export type RecipeFromMany = GetRecipesQuery['recipeMany'][0];
export type RecipeFromIngredientsMany = GetIngredientsQuery['recipeMany'][0];
export interface EditableIngredient {
    value: string | null;
    data?: Ingredient | RecipeFromIngredientsMany;
}
export type FinishedIngredient = Ingredient | RecipeFromIngredientsMany;
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
export type IngredientListRecipe = Pick<
    Recipe,
    '_id' | 'title' | 'pluralTitle' | 'instructions' | 'numServings'
> & { ingredients: RecipeIngredient[] };
