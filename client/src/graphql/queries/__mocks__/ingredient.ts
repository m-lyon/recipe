import { GetIngredientsQuery } from '@recipe/graphql/generated';
import { GetIngredientsQueryVariables, Ingredient } from '@recipe/graphql/generated';
import { mockAppleId, mockCarrotId, mockChickenId } from '@recipe/graphql/__mocks__/ids';
import { mockAdminId, mockLettuceId, mockRhubarbPieId } from '@recipe/graphql/__mocks__/ids';

import { GET_INGREDIENTS } from '../ingredient';

// Ingredients
export const mockApple: Ingredient = {
    _id: mockAppleId,
    __typename: 'Ingredient' as const,
    name: 'apple',
    pluralName: 'apples',
    isCountable: true,
    density: null,
    owner: mockAdminId,
    tags: ['vegan', 'vegetarian'],
};
export const mockChicken: Ingredient = {
    _id: mockChickenId,
    __typename: 'Ingredient' as const,
    name: 'chicken',
    pluralName: 'chickens',
    isCountable: false,
    density: null,
    owner: mockAdminId,
    tags: [],
};
export const mockCarrot: Ingredient = {
    _id: mockCarrotId,
    __typename: 'Ingredient' as const,
    name: 'carrot',
    pluralName: 'carrots',
    isCountable: true,
    density: null,
    owner: mockAdminId,
    tags: ['vegan', 'vegetarian'],
};
export const mockLettuce: Ingredient = {
    _id: mockLettuceId,
    __typename: 'Ingredient' as const,
    name: 'iceberg lettuce',
    pluralName: 'iceberg lettuces',
    isCountable: false,
    density: null,
    owner: mockAdminId,
    tags: ['vegan', 'vegetarian'],
};
// Recipes
export const mockRhurbarbPie: RecipeChoice = {
    _id: mockRhubarbPieId,
    __typename: 'Recipe' as const,
    title: 'rhubarb pie',
    pluralTitle: 'rhubarb pies',
};
export const mockIngredients = [mockApple, mockChicken, mockCarrot, mockLettuce];
export const mockRecipeFromIngredients = [mockRhurbarbPie];
export const mockGetIngredients = {
    request: {
        query: GET_INGREDIENTS,
        variables: { filter: {} } satisfies GetIngredientsQueryVariables,
    },
    result: {
        data: {
            __typename: 'Query',
            ingredientMany: mockIngredients,
        } satisfies GetIngredientsQuery,
    },
};
