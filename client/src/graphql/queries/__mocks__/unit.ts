import { GetUnitsQueryVariables } from '@recipe/graphql/generated';
import { EnumUnitPreferredNumberFormat, GetUnitsQuery } from '@recipe/graphql/generated';
import { mockAdminId, mockTablespoonId, mockTeaspoonId } from '@recipe/graphql/__mocks__/ids';
import { mockCupId, mockGramId, mockKilogramId, mockOunceId } from '@recipe/graphql/__mocks__/ids';

import { GET_UNITS } from '../unit';

export const mockTeaspoon = {
    __typename: 'Unit' as const,
    _id: mockTeaspoonId,
    shortSingular: 'tsp',
    shortPlural: 'tsp',
    longSingular: 'teaspoon',
    longPlural: 'teaspoons',
    preferredNumberFormat: EnumUnitPreferredNumberFormat.Fraction,
    owner: mockAdminId,
    unique: true,
    hasSpace: true,
};
export const mockTablespoon = {
    __typename: 'Unit' as const,
    _id: mockTablespoonId,
    shortSingular: 'tbsp',
    shortPlural: 'tbsp',
    longSingular: 'tablespoon',
    longPlural: 'tablespoons',
    preferredNumberFormat: EnumUnitPreferredNumberFormat.Fraction,
    owner: mockAdminId,
    unique: true,
    hasSpace: true,
};
export const mockGram = {
    __typename: 'Unit' as const,
    _id: mockGramId,
    shortSingular: 'g',
    shortPlural: 'g',
    longSingular: 'gram',
    longPlural: 'grams',
    preferredNumberFormat: EnumUnitPreferredNumberFormat.Decimal,
    owner: mockAdminId,
    unique: true,
    hasSpace: false,
};
export const mockKilogram = {
    __typename: 'Unit' as const,
    _id: mockKilogramId,
    shortSingular: 'kg',
    shortPlural: 'kg',
    longSingular: 'kilogram',
    longPlural: 'kilograms',
    preferredNumberFormat: EnumUnitPreferredNumberFormat.Decimal,
    owner: mockAdminId,
    unique: true,
    hasSpace: false,
};
export const mockOunce = {
    __typename: 'Unit' as const,
    _id: mockOunceId,
    shortSingular: 'oz',
    shortPlural: 'oz',
    longSingular: 'ounce',
    longPlural: 'ounces',
    preferredNumberFormat: EnumUnitPreferredNumberFormat.Decimal,
    owner: mockAdminId,
    unique: true,
    hasSpace: true,
};
export const mockCup = {
    __typename: 'Unit' as const,
    _id: mockCupId,
    shortSingular: 'cup',
    shortPlural: 'cups',
    longSingular: 'cup',
    longPlural: 'cups',
    preferredNumberFormat: EnumUnitPreferredNumberFormat.Fraction,
    owner: mockAdminId,
    unique: true,
    hasSpace: true,
};
export const mockUnits = [mockTeaspoon, mockTablespoon, mockGram, mockKilogram, mockOunce, mockCup];
export const mockGetUnits = {
    request: { query: GET_UNITS, variables: { filter: {} } satisfies GetUnitsQueryVariables },
    result: { data: { unitMany: mockUnits } satisfies GetUnitsQuery },
};
