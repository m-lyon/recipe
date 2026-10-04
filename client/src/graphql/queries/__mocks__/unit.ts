import { Unit } from '@recipe/graphql/schema';
import { GetUnitsQuery, GetUnitsQueryVariables } from '@recipe/graphql/generated';
import { mockCupId, mockGramId, mockKilogramId } from '@recipe/graphql/__mocks__/ids';
import { mockEachId, mockMilliliterId, mockOunceId } from '@recipe/graphql/__mocks__/ids';
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
    dimension: 'volume',
    perCanonical: 4.92892159375,
    system: 'us',
    hidden: false,
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
    dimension: 'volume',
    perCanonical: 14.78676478125,
    system: 'us',
    hidden: false,
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
    dimension: 'mass',
    perCanonical: 1,
    system: 'metric',
    hidden: false,
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
    dimension: 'mass',
    perCanonical: 1000,
    system: 'metric',
    hidden: false,
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
    dimension: 'mass',
    perCanonical: 28.349523125,
    system: 'us',
    hidden: false,
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
    dimension: 'volume',
    perCanonical: 236.5882365,
    system: 'us',
    hidden: false,
};
export const mockMilliliter: Unit = {
    __typename: 'Unit',
    _id: mockMilliliterId,
    shortSingular: 'ml',
    shortPlural: 'ml',
    longSingular: 'millilitre',
    longPlural: 'millilitres',
    preferredNumberFormat: 'decimal',
    owner: mockAdminId,
    unique: true,
    hasSpace: false,
    dimension: 'volume',
    perCanonical: 1,
    system: 'metric',
    hidden: false,
};
export const mockEach: Unit = {
    __typename: 'Unit',
    _id: mockEachId,
    shortSingular: 'ea',
    shortPlural: 'ea',
    longSingular: 'each',
    longPlural: 'each',
    preferredNumberFormat: 'fraction',
    owner: mockAdminId,
    unique: true,
    hasSpace: true,
    dimension: 'count',
    perCanonical: 1,
    system: null,
    hidden: true,
};
export const mockUnits = [
    mockTeaspoon,
    mockTablespoon,
    mockGram,
    mockKilogram,
    mockOunce,
    mockCup,
    mockMilliliter,
    mockEach,
];
export const mockGetUnits = {
    request: { query: GET_UNITS, variables: { filter: {} } satisfies GetUnitsQueryVariables },
    result: { data: { __typename: 'Query', unitMany: mockUnits } satisfies GetUnitsQuery },
};

// Pages that list every unit query without a filter
export const mockGetAllUnits = { ...mockGetUnits, request: { query: GET_UNITS } };
