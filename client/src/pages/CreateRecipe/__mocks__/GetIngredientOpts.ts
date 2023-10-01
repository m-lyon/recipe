import { GET_INGREDIENT_OPTS } from '../components/IngredientDropdown';

export const mockGetIngredientOpts = [
    {
        request: {
            query: GET_INGREDIENT_OPTS,
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
                unitMany: [
                    {
                        _id: '60f4d2e5c3d5a0a4f1b9c0f2',
                        shortSingular: 'tsp',
                        shortPlural: 'tsp',
                        longSingular: 'teaspoon',
                        longPlural: 'teaspoons',
                    },
                    {
                        _id: '60f4d2e5c3d5a0a4f1b9c0f3',
                        shortSingular: 'tbsp',
                        shortPlural: 'tbsp',
                        longSingular: 'tablespoon',
                        longPlural: 'tablespoons',
                    },
                    {
                        _id: '60f4d2e5c3d5a0a4f1b9c0f4',
                        shortSingular: 'oz',
                        shortPlural: 'oz',
                        longSingular: 'ounce',
                        longPlural: 'ounces',
                    },
                    {
                        _id: '60f4d2e5c3d5a0a4f1b9c0f6',
                        shortSingular: 'cup',
                        shortPlural: 'cups',
                        longSingular: 'cup',
                        longPlural: 'cups',
                    },
                ],
                prepMethodMany: [
                    {
                        _id: '60f4d2e5c3d5a0a4f1b9c0fa',
                        value: 'chopped',
                    },
                    {
                        _id: '60f4d2e5c3d5a0a4f1b9c0fb',
                        value: 'diced',
                    },
                    {
                        _id: '60f4d2e5c3d5a0a4f1b9c0fd',
                        value: 'sliced',
                    },
                    {
                        _id: '60f4d2e5c3d5a0a4f1b9c0fe',
                        value: 'grated',
                    },
                ],
            },
        },
    },
];
