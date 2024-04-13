import { GET_INGREDIENTS } from '@recipe/graphql/queries/ingredient';

export const mockGetIngredients = {
    request: {
        query: GET_INGREDIENTS,
    },
    result: {
        data: {
            ingredientMany: [
                {
                    _id: '60f4d2e5c3d5a0a4f1b9c0e8',
                    __typename: 'Ingredient',
                    name: 'apple',
                    pluralName: 'apples',
                    isCountable: true,
                    owner: '60f4d2e5c3d5a0a4f1b9c0ec',
                },
                {
                    _id: '60f4d2e5c3d5a0a4f1b9c0e9',
                    __typename: 'Ingredient',
                    name: 'chicken',
                    pluralName: 'chickens',
                    isCountable: false,
                    owner: '60f4d2e5c3d5a0a4f1b9c0ec',
                },
                {
                    _id: '60f4d2e5c3d5a0a4f1b9c0ea',
                    __typename: 'Ingredient',
                    name: 'carrot',
                    pluralName: 'carrots',
                    isCountable: true,
                    owner: '60f4d2e5c3d5a0a4f1b9c0ec',
                },
                {
                    _id: '60f4d2e5c3d5a0a4f1b9c0f0',
                    __typename: 'Ingredient',
                    name: 'iceberg lettuce',
                    pluralName: 'iceberg lettuces',
                    isCountable: false,
                    owner: '60f4d2e5c3d5a0a4f1b9c0ec',
                },
            ],
            recipeMany: [],
        },
    },
};

export const mockGetIngredientsWithRecipe = {
    request: { ...mockGetIngredients.request },
    result: {
        data: {
            ...mockGetIngredients.result.data,
            recipeMany: [
                {
                    _id: '60f4d2e5c3d5a0a4f1b9c0eb',
                    __typename: 'Recipe',
                    title: 'rhubarb pie',
                    pluralTitle: 'rhubarb pies',
                    owner: '60f4d2e5c3d5a0a4f1b9c0ec',
                },
            ],
        },
    },
};
