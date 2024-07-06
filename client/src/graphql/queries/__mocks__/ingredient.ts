import { GET_INGREDIENTS } from '@recipe/graphql/queries/ingredient';
import { mockAppleId, mockCarrotId, mockChickenId } from '@recipe/graphql/__mocks__/ids';
import { mockAdminId, mockLettuceId, mockRhubarbPieId } from '@recipe/graphql/__mocks__/ids';

// Ingredients
export const mockApple = {
    _id: mockAppleId,
    __typename: 'Ingredient' as const,
    name: 'apple',
    pluralName: 'apples',
    isCountable: true,
    owner: mockAdminId,
    tags: ['vegan', 'vegetarian'],
};
export const mockChicken = {
    _id: mockChickenId,
    __typename: 'Ingredient' as const,
    name: 'chicken',
    pluralName: 'chickens',
    isCountable: false,
    owner: mockAdminId,
    tags: [],
};
export const mockCarrot = {
    _id: mockCarrotId,
    __typename: 'Ingredient' as const,
    name: 'carrot',
    pluralName: 'carrots',
    isCountable: true,
    owner: mockAdminId,
    tags: ['vegan', 'vegetarian'],
};
export const mockLettuce = {
    _id: mockLettuceId,
    __typename: 'Ingredient' as const,
    name: 'iceberg lettuce',
    pluralName: 'iceberg lettuces',
    isCountable: false,
    owner: mockAdminId,
    tags: ['vegan', 'vegetarian'],
};
// Recipes
export const mockRhurbarbPie = {
    _id: mockRhubarbPieId,
    __typename: 'Recipe' as const,
    title: 'rhubarb pie',
    pluralTitle: 'rhubarb pies',
    owner: mockAdminId,
    calculatedTags: ['vegetarian'],
};

export const mockGetIngredients = {
    request: {
        query: GET_INGREDIENTS,
    },
    result: {
        data: {
            ingredientMany: [mockApple, mockChicken, mockCarrot, mockLettuce],
            recipeMany: [],
        },
    },
};

export const mockGetIngredientsWithRecipe = {
    request: { ...mockGetIngredients.request },
    result: {
        data: {
            ...mockGetIngredients.result.data,
            recipeMany: [mockRhurbarbPie],
        },
    },
};
