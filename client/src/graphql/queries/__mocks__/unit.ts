import { mockMilliliterId, mockOunceId } from '@recipe/graphql/__mocks__/ids';
import { mockCupId, mockGramId, mockKilogramId } from '@recipe/graphql/__mocks__/ids';
import { GetUnitsQuery, GetUnitsQueryVariables, Unit } from '@recipe/graphql/generated';
import { mockAdminId, mockTablespoonId, mockTeaspoonId } from '@recipe/graphql/__mocks__/ids';

import { GET_UNITS } from '../unit';

export const mockTeaspoon: Unit = {
    __typename: 'Unit',
    _id: mockTeaspoonId,
    shortSingular: 'tsp',
    shortPlural: 'tsp',
    longSingular: 'teaspoon',
    longPlural: 'teaspoons',
    preferredNumberFormat: 'fraction',
    owner: mockAdminId,
    unique: true,
    hasSpace: true,
    measureType: null,
};
export const mockTablespoon: Unit = {
    __typename: 'Unit',
    _id: mockTablespoonId,
    shortSingular: 'tbsp',
    shortPlural: 'tbsp',
    longSingular: 'tablespoon',
    longPlural: 'tablespoons',
    preferredNumberFormat: 'fraction',
    owner: mockAdminId,
    unique: true,
    hasSpace: true,
    measureType: null,
};
export const mockGram: Unit = {
    __typename: 'Unit',
    _id: mockGramId,
    shortSingular: 'g',
    shortPlural: 'g',
    longSingular: 'gram',
    longPlural: 'grams',
    preferredNumberFormat: 'decimal',
    owner: mockAdminId,
    unique: true,
    hasSpace: false,
    measureType: 'mass',
};
export const mockKilogram: Unit = {
    __typename: 'Unit',
    _id: mockKilogramId,
    shortSingular: 'kg',
    shortPlural: 'kg',
    longSingular: 'kilogram',
    longPlural: 'kilograms',
    preferredNumberFormat: 'decimal',
    owner: mockAdminId,
    unique: true,
    hasSpace: false,
    measureType: 'mass',
};
export const mockOunce: Unit = {
    __typename: 'Unit',
    _id: mockOunceId,
    shortSingular: 'oz',
    shortPlural: 'oz',
    longSingular: 'ounce',
    longPlural: 'ounces',
    preferredNumberFormat: 'decimal',
    owner: mockAdminId,
    unique: true,
    hasSpace: true,
    measureType: 'mass',
};
export const mockCup: Unit = {
    __typename: 'Unit',
    _id: mockCupId,
    shortSingular: 'cup',
    shortPlural: 'cups',
    longSingular: 'cup',
    longPlural: 'cups',
    preferredNumberFormat: 'fraction',
    owner: mockAdminId,
    unique: true,
    hasSpace: true,
    measureType: 'volume',
};
export const mockMilliliter: Unit = {
    __typename: 'Unit',
    _id: mockMilliliterId,
    shortSingular: 'ml',
    shortPlural: 'ml',
    longSingular: 'milliliter',
    longPlural: 'milliliters',
    preferredNumberFormat: 'decimal',
    owner: mockAdminId,
    unique: true,
    hasSpace: false,
    measureType: 'volume',
};
export const mockUnits = [
    mockTeaspoon,
    mockTablespoon,
    mockGram,
    mockKilogram,
    mockOunce,
    mockCup,
    mockMilliliter,
];
export const mockGetUnits = {
    request: { query: GET_UNITS, variables: { filter: {} } satisfies GetUnitsQueryVariables },
    result: { data: { __typename: 'Query', unitMany: mockUnits } satisfies GetUnitsQuery },
};
