import { mockAppleId, mockCarrotId, mockChickenId } from '@recipe/graphql/__mocks__/ids';
import { mockAdminId, mockLettuceId, mockRhubarbPieId } from '@recipe/graphql/__mocks__/ids';
import { EnumIngredientTags, GetIngredientsQuery, Ingredient } from '@recipe/graphql/generated';

import { GET_INGREDIENTS } from '../ingredient';

// Ingredients
export const mockApple: Ingredient = {
    _id: mockAppleId,
    __typename: 'Ingredient' as const,
    name: 'apple',
    pluralName: 'apples',
    isCountable: true,
    owner: mockAdminId,
    tags: [EnumIngredientTags.Vegan, EnumIngredientTags.Vegetarian],
};
export const mockChicken: Ingredient = {
    _id: mockChickenId,
    __typename: 'Ingredient' as const,
    name: 'chicken',
    pluralName: 'chickens',
    isCountable: false,
    owner: mockAdminId,
    tags: [],
};
export const mockCarrot: Ingredient = {
    _id: mockCarrotId,
    __typename: 'Ingredient' as const,
    name: 'carrot',
    pluralName: 'carrots',
    isCountable: true,
    owner: mockAdminId,
    tags: [EnumIngredientTags.Vegan, EnumIngredientTags.Vegetarian],
};
export const mockLettuce: Ingredient = {
    _id: mockLettuceId,
    __typename: 'Ingredient' as const,
    name: 'iceberg lettuce',
    pluralName: 'iceberg lettuces',
    isCountable: false,
    owner: mockAdminId,
    tags: [EnumIngredientTags.Vegan, EnumIngredientTags.Vegetarian],
};
// Recipes
export const mockRhurbarbPie = {
    _id: mockRhubarbPieId,
    __typename: 'Recipe' as const,
    title: 'rhubarb pie',
    pluralTitle: 'rhubarb pies',
    owner: mockAdminId,
    calculatedTags: [EnumIngredientTags.Vegetarian],
};
export const mockIngredients = [mockApple, mockChicken, mockCarrot, mockLettuce];
export const mockRecipeFromIngredients = [mockRhurbarbPie];
export const mockGetIngredients = {
    request: { query: GET_INGREDIENTS },
    result: {
        data: { ingredientMany: mockIngredients, recipeMany: [] } satisfies GetIngredientsQuery,
    },
};
