import { GET_UNITS } from '@recipe/graphql/queries/unit';
import { EnumUnitPreferredNumberFormat } from '@recipe/graphql/generated';
import { mockAdminId, mockTeaspoonId } from '@recipe/graphql/__mocks__/ids';
import { mockCupId, mockGramId, mockKilogramId, mockOunceId } from '@recipe/graphql/__mocks__/ids';

export const mockTeaspoon = {
    __typename: 'Unit' as const,
    _id: mockTeaspoonId,
    shortSingular: 'tsp',
    shortPlural: 'tsp',
    longSingular: 'teaspoon',
    longPlural: 'teaspoons',
    preferredNumberFormat: 'fraction' as EnumUnitPreferredNumberFormat,
    owner: mockAdminId,
    hasSpace: true,
};
export const mockGram = {
    __typename: 'Unit' as const,
    _id: mockGramId,
    shortSingular: 'g',
    shortPlural: 'g',
    longSingular: 'gram',
    longPlural: 'grams',
    preferredNumberFormat: 'decimal' as EnumUnitPreferredNumberFormat,
    owner: mockAdminId,
    hasSpace: false,
};
export const mockKilogram = {
    __typename: 'Unit' as const,
    _id: mockKilogramId,
    shortSingular: 'kg',
    shortPlural: 'kg',
    longSingular: 'kilogram',
    longPlural: 'kilograms',
    preferredNumberFormat: 'decimal' as EnumUnitPreferredNumberFormat,
    owner: mockAdminId,
    hasSpace: false,
};
export const mockOunce = {
    __typename: 'Unit' as const,
    _id: mockOunceId,
    shortSingular: 'oz',
    shortPlural: 'oz',
    longSingular: 'ounce',
    longPlural: 'ounces',
    preferredNumberFormat: 'decimal' as EnumUnitPreferredNumberFormat,
    owner: mockAdminId,
    hasSpace: true,
};
export const mockCup = {
    __typename: 'Unit' as const,
    _id: mockCupId,
    shortSingular: 'cup',
    shortPlural: 'cups',
    longSingular: 'cup',
    longPlural: 'cups',
    preferredNumberFormat: 'fraction' as EnumUnitPreferredNumberFormat,
    owner: mockAdminId,
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
