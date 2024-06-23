import { GET_UNITS } from '@recipe/graphql/queries/unit';

export const mockTeaspoon = {
    __typename: 'Unit',
    _id: '60f4d2e5c3d5a0a4f1b9c0f2',
    shortSingular: 'tsp',
    shortPlural: 'tsp',
    longSingular: 'teaspoon',
    longPlural: 'teaspoons',
    preferredNumberFormat: 'fraction',
    owner: '60f4d2e5c3d5a0a4f1b9c0ec',
    hasSpace: true,
};
export const mockGram = {
    __typename: 'Unit',
    _id: '60f4d2e5c3d5a0a4f1b9c0f3',
    shortSingular: 'g',
    shortPlural: 'g',
    longSingular: 'gram',
    longPlural: 'grams',
    preferredNumberFormat: 'decimal',
    owner: '60f4d2e5c3d5a0a4f1b9c0ec',
    hasSpace: false,
};
export const mockKilogram = {
    __typename: 'Unit',
    _id: '60f4d2e5c3d5a0a4f1b9c0f5',
    shortSingular: 'kg',
    shortPlural: 'kg',
    longSingular: 'kilogram',
    longPlural: 'kilograms',
    preferredNumberFormat: 'decimal',
    owner: '60f4d2e5c3d5a0a4f1b9c0ec',
    hasSpace: false,
};
export const mockOunce = {
    __typename: 'Unit',
    _id: '60f4d2e5c3d5a0a4f1b9c0f4',
    shortSingular: 'oz',
    shortPlural: 'oz',
    longSingular: 'ounce',
    longPlural: 'ounces',
    preferredNumberFormat: 'decimal',
    owner: '60f4d2e5c3d5a0a4f1b9c0ec',
    hasSpace: true,
};
export const mockCup = {
    __typename: 'Unit',
    _id: '60f4d2e5c3d5a0a4f1b9c0f6',
    shortSingular: 'cup',
    shortPlural: 'cups',
    longSingular: 'cup',
    longPlural: 'cups',
    preferredNumberFormat: 'fraction',
    owner: '60f4d2e5c3d5a0a4f1b9c0ec',
    hasSpace: true,
};

export const mockGetUnits = {
    request: {
        query: GET_UNITS,
    },
    result: {
        data: {
            unitMany: [mockTeaspoon, mockGram, mockKilogram, mockOunce, mockCup],
        },
    },
};
