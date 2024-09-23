import { GetUnitConversionsQuery } from '@recipe/graphql/generated';
import { mockConversionRuleIdThree } from '@recipe/graphql/__mocks__/ids';
import { GET_UNIT_CONVERSIONS } from '@recipe/graphql/queries/unitConversion';
import { mockConversionRuleIdOne, mockUnitConversionIdOne } from '@recipe/graphql/__mocks__/ids';
import { mockConversionRuleIdTwo, mockUnitConversionIdTwo } from '@recipe/graphql/__mocks__/ids';

import { mockCup, mockGram, mockKilogram, mockTablespoon, mockTeaspoon } from './unit';

export const mockConversionRuleOne = {
    __typename: 'ConversionRule' as const,
    _id: mockConversionRuleIdOne,
    unit: mockKilogram,
    baseUnitThreshold: 1000,
    baseToUnitConversion: 1000,
};
export const mockConversionRuleTwo = {
    __typename: 'ConversionRule' as const,
    _id: mockConversionRuleIdTwo,
    unit: mockTablespoon,
    baseUnitThreshold: 3,
    baseToUnitConversion: 3,
};
export const mockConversionRuleThree = {
    __typename: 'ConversionRule' as const,
    _id: mockConversionRuleIdThree,
    unit: mockCup,
    baseUnitThreshold: 12,
    baseToUnitConversion: 48,
};
export const mockUnitConversionOne = {
    __typename: 'UnitConversion' as const,
    _id: mockUnitConversionIdOne,
    baseUnit: mockGram,
    rules: [mockConversionRuleOne],
};
export const mockUnitConversionTwo = {
    __typename: 'UnitConversion' as const,
    _id: mockUnitConversionIdTwo,
    baseUnit: mockTeaspoon,
    rules: [mockConversionRuleThree, mockConversionRuleTwo],
};
export const mockGetUnitConversions = {
    request: {
        query: GET_UNIT_CONVERSIONS,
    },
    result: {
        data: {
            unitConversionMany: [mockUnitConversionOne, mockUnitConversionTwo],
        } satisfies GetUnitConversionsQuery,
    },
};
