import { GET_INGREDIENTS } from '../components/EditableIngredientList/components/IngredientDropdown';

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
                },
                {
                    _id: '60f4d2e5c3d5a0a4f1b9c0e9',
                    name: 'chicken',
                },
                {
                    _id: '60f4d2e5c3d5a0a4f1b9c0ea',
                    name: 'carrot',
                },
                {
                    _id: '60f4d2e5c3d5a0a4f1b9c0f0',
                    name: 'iceberg lettuce',
                },
                {
                    _id: '60f4d2e5c3d5a0a4f1b9c0f1',
                    name: 'jalapeno',
                },
            ],
        },
    },
};
