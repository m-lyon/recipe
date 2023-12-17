import { GET_UNITS } from '../components/EditableIngredient';

export const mockGetUnits = {
    request: {
        query: GET_UNITS,
    },
    result: {
        data: {
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
        },
    },
};
