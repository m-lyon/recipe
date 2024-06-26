import { GET_RECIPE } from '@recipe/graphql/queries/recipe';

export const mockGetRecipe = {
    request: {
        query: GET_RECIPE,
        variables: { filter: { titleIdentifier: undefined } },
    },
    result: {
        data: {
            recipeOne: {
                _id: '60f4d2e5c3d5a0a4f1b9c0eb',
                title: 'Mock Recipe',
                pluralTitle: null,
                titleIdentifier: 'mock-recipe',
                instructions: ['Instruction one', 'Instruction two'],
                ingredients: [
                    {
                        // normal ingredient
                        type: 'ingredient',
                        quantity: '1',
                        unit: {
                            _id: '60f4d2e5c3d5a0a4f1b9c0f2',
                            shortSingular: 'tsp',
                            shortPlural: 'tsp',
                            longSingular: 'teaspoon',
                            longPlural: 'teaspoons',
                            preferredNumberFormat: 'fraction',
                            hasSpace: true,
                        },
                        ingredient: {
                            __typename: 'Ingredient',
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
                        type: 'ingredient',
                        quantity: '1',
                        unit: null,
                        ingredient: {
                            __typename: 'Ingredient',
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
                        type: 'ingredient',
                        quantity: '2',
                        unit: null,
                        ingredient: {
                            __typename: 'Ingredient',
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
                        type: 'ingredient',
                        quantity: '1/3',
                        unit: {
                            _id: '60f4d2e5c3d5a0a4f1b9c0f6',
                            shortSingular: 'cup',
                            shortPlural: 'cups',
                            longSingular: 'cup',
                            longPlural: 'cups',
                            preferredNumberFormat: 'fraction',
                            hasSpace: true,
                        },
                        ingredient: {
                            __typename: 'Ingredient',
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
                        type: 'ingredient',
                        quantity: '1',
                        unit: {
                            _id: '60f4d2e5c3d5a0a4f1b9c0f4',
                            shortSingular: 'oz',
                            shortPlural: 'oz',
                            longSingular: 'ounce',
                            longPlural: 'ounces',
                            preferredNumberFormat: 'decimal',
                            hasSpace: true,
                        },
                        ingredient: {
                            __typename: 'Ingredient',
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
                calculatedTags: ['vegan', 'vegetarian'],
                numServings: 4,
                isIngredient: false,
                notes: null,
                images: [],
                source: null,
            },
        },
    },
};
