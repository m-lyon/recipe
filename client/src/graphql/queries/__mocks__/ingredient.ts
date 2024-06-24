import { GET_INGREDIENTS } from '@recipe/graphql/queries/ingredient';

// Ingredients
export const mockApple = {
    _id: '60f4d2e5c3d5a0a4f1b9c0e8',
    __typename: 'Ingredient' as const,
    name: 'apple',
    pluralName: 'apples',
    isCountable: true,
    owner: '60f4d2e5c3d5a0a4f1b9c0ec',
    tags: ['vegan', 'vegetarian'],
};
export const mockChicken = {
    _id: '60f4d2e5c3d5a0a4f1b9c0e9',
    __typename: 'Ingredient' as const,
    name: 'chicken',
    pluralName: 'chickens',
    isCountable: false,
    owner: '60f4d2e5c3d5a0a4f1b9c0ec',
    tags: [],
};
export const mockCarrot = {
    _id: '60f4d2e5c3d5a0a4f1b9c0ea',
    __typename: 'Ingredient' as const,
    name: 'carrot',
    pluralName: 'carrots',
    isCountable: true,
    owner: '60f4d2e5c3d5a0a4f1b9c0ec',
    tags: ['vegan', 'vegetarian'],
};
export const mockLettuce = {
    _id: '60f4d2e5c3d5a0a4f1b9c0f0',
    __typename: 'Ingredient' as const,
    name: 'iceberg lettuce',
    pluralName: 'iceberg lettuces',
    isCountable: false,
    owner: '60f4d2e5c3d5a0a4f1b9c0ec',
    tags: ['vegan', 'vegetarian'],
};
// Recipes
export const mockRhurbarbPie = {
    _id: '60f4d2e5c3d5a0a4f1b9c0eb',
    __typename: 'Recipe' as const,
    title: 'rhubarb pie',
    pluralTitle: 'rhubarb pies',
    owner: '60f4d2e5c3d5a0a4f1b9c0ec',
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
