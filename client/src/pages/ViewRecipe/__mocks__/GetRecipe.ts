import { GET_RECIPE } from '..';

export const mockGetRecipe = {
    request: {
        query: GET_RECIPE,
    },
    result: {
        data: {
            recipeById: {
                title: 'Mock Recipe',
                instructions: ['Instruction one', 'Instruction two'],
                ingredients: [
                    {
                        // normal ingredient
                        quantity: '1',
                        unit: {
                            _id: '60f4d2e5c3d5a0a4f1b9c0f2',
                            shortSingular: 'tsp',
                            shortPlural: 'tsp',
                        },
                        ingredient: {
                            _id: '60f4d2e5c3d5a0a4f1b9c0e8',
                            name: 'apple',
                            pluralName: 'apples',
                            isCountable: true,
                        },
                        prepMethod: {
                            _id: '60f4d2e5c3d5a0a4f1b9c0f8',
                            value: 'diced',
                        },
                    },
                    {
                        // ingredient with no unit
                        quantity: '1',
                        unit: null,
                        ingredient: {
                            _id: '60f4d2e5c3d5a0a4f1b9c0e8',
                            name: 'apple',
                            pluralName: 'apples',
                            isCountable: true,
                        },
                        prepMethod: {
                            _id: '60f4d2e5c3d5a0a4f1b9c0f8',
                            value: 'diced',
                        },
                    },
                    {
                        // ingredient with no unit and plural quantity
                        quantity: '2',
                        unit: null,
                        ingredient: {
                            _id: '60f4d2e5c3d5a0a4f1b9c0e8',
                            name: 'apple',
                            pluralName: 'apples',
                            isCountable: true,
                        },
                        prepMethod: {
                            _id: '60f4d2e5c3d5a0a4f1b9c0f8',
                            value: 'diced',
                        },
                    },
                    {
                        // ingredient with fraction quantity
                        quantity: '1/3',
                        unit: {
                            _id: '60f4d2e5c3d5a0a4f1b9c0f6',
                            shortSingular: 'cup',
                            shortPlural: 'cups',
                        },
                        ingredient: {
                            _id: '60f4d2e5c3d5a0a4f1b9c0e8',
                            name: 'apple',
                            pluralName: 'apples',
                            isCountable: true,
                        },
                        prepMethod: {
                            _id: '60f4d2e5c3d5a0a4f1b9c0f8',
                            value: 'diced',
                        },
                    },
                    {
                        // ingredient with no prep method
                        quantity: '1',
                        unit: {
                            _id: '60f4d2e5c3d5a0a4f1b9c0f4',
                            shortSingular: 'ounce',
                            shortPlural: 'ounces',
                        },
                        ingredient: {
                            _id: '60f4d2e5c3d5a0a4f1b9c0e8',
                            name: 'apple',
                            pluralName: 'apples',
                            isCountable: true,
                        },
                        prepMethod: null,
                    },
                ],
                tags: [
                    {
                        _id: '60f4d2e5c3d5a0a4f1b9c0e8',
                        value: 'dinner',
                    },
                    {
                        _id: '60f4d2e5c3d5a0a4f1b9c0e9',
                        value: 'lunch',
                    },
                ],
            },
        },
    },
};
