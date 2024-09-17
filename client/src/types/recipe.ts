import { GetRecipeQuery, GetRecipesQuery } from '@recipe/graphql/generated';
import { Ingredient, PrepMethod, Recipe, Size } from '@recipe/graphql/generated';
import { EnumRecipeIngredientType, RecipeIngredient, Unit } from '@recipe/graphql/generated';
import { GetIngredientComponentsQuery, GetIngredientsQuery } from '@recipe/graphql/generated';

export type Quantity = string | null;
export type EditableQuantity = Quantity;
export type FinishedQuantity = Quantity;
export interface EditableUnit {
    value: string | null;
    data?: Unit | null;
}
export type FinishedUnit = Unit | null;
export interface EditableSize {
    value: string | null;
    data?: Size | null;
}
export type FinishedSize = Size | null;
export type RecipeFromOne = GetRecipeQuery['recipeOne'];
export type Images = NonNullable<GetRecipeQuery['recipeOne']>['images'];
export type RecipeFromMany = GetRecipesQuery['recipeMany'][0];
export type RecipeFromIngredientsMany = GetIngredientsQuery['recipeMany'][0];
export type IngredientAndRecipe = Ingredient | RecipeFromIngredientsMany;
export interface EditableIngredient {
    value: string | null;
    data?: IngredientAndRecipe;
}
export type FinishedIngredient = IngredientAndRecipe;
export interface EditablePrepMethod {
    value: string | null;
    data?: PrepMethod | null;
}
export type FinishedPrepMethod = PrepMethod | null;
export type InputState = 'quantity' | 'unit' | 'size' | 'ingredient' | 'prepMethod';
export interface EditableRecipeIngredient {
    quantity: EditableQuantity;
    unit: EditableUnit;
    size: EditableSize;
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
    size: FinishedSize;
    ingredient: FinishedIngredient;
    prepMethod: FinishedPrepMethod;
    key: string;
}

export type LikeFinishedRecipeIngredient = Omit<FinishedRecipeIngredient, 'key'>;
export type RecipeIngredientQueryData = GetIngredientComponentsQuery | undefined;
export type IngredientListRecipe = Pick<
    Recipe,
    '_id' | 'title' | 'pluralTitle' | 'instructionSubsections' | 'numServings'
> & { ingredientSubsections: IngredientSubsection[] };
export interface IngredientSubsection {
    name?: string;
    ingredients: RecipeIngredient[];
}
export interface RecipeAsIngredient extends RecipeIngredient {
    type: EnumRecipeIngredientType.Recipe;
    ingredient: Recipe;
}
export type Item = string | Unit | Size | IngredientAndRecipe | PrepMethod;
