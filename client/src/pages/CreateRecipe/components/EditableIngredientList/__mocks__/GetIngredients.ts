import { GET_INGREDIENTS } from '../../../hooks/useIngredientList';

export const mockGetIngredients = {
    request: {
        query: GET_INGREDIENTS,
    },
    result: {
        data: {
            ingredientMany: [
                {
                    _id: '60f4d2e5c3d5a0a4f1b9c0e8',
                    name: 'apple',
                    pluralName: 'apples',
                    isCountable: true,
                },
                {
                    _id: '60f4d2e5c3d5a0a4f1b9c0e9',
                    name: 'chicken',
                    pluralName: 'chickens',
                    isCountable: false,
                },
                {
                    _id: '60f4d2e5c3d5a0a4f1b9c0ea',
                    name: 'carrot',
                    pluralName: 'carrots',
                    isCountable: true,
                },
                {
                    _id: '60f4d2e5c3d5a0a4f1b9c0f0',
                    name: 'iceberg lettuce',
                    pluralName: 'iceberg lettuces',
                    isCountable: false,
                },
            ],
        },
        recipeMany: [
            { _id: '60f4d2e5c3d5a0a4f1b9c0eb', title: 'apple pie', pluralTitle: 'apple pies' },
        ],
    },
};
