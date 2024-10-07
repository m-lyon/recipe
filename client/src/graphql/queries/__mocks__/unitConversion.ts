import { mockConversionRuleIdThree } from '@recipe/graphql/__mocks__/ids';
import { GET_UNIT_CONVERSIONS } from '@recipe/graphql/queries/unitConversion';
import { ConversionRule, GetUnitConversionsQuery } from '@recipe/graphql/generated';
import { mockConversionRuleIdOne, mockUnitConversionIdOne } from '@recipe/graphql/__mocks__/ids';
import { mockConversionRuleIdTwo, mockUnitConversionIdTwo } from '@recipe/graphql/__mocks__/ids';

import { mockCup, mockGram, mockKilogram, mockTablespoon, mockTeaspoon } from './unit';

export const mockConversionRuleOne: ConversionRule = {
    __typename: 'ConversionRule',
    _id: mockConversionRuleIdOne,
    unit: mockKilogram,
    baseUnit: mockGram,
    baseUnitThreshold: 1000,
    baseToUnitConversion: 1000,
};
export const mockConversionRuleTwo: ConversionRule = {
    __typename: 'ConversionRule',
    _id: mockConversionRuleIdTwo,
    unit: mockTablespoon,
    baseUnit: mockTeaspoon,
    baseUnitThreshold: 3,
    baseToUnitConversion: 3,
};
export const mockConversionRuleThree: ConversionRule = {
    __typename: 'ConversionRule',
    _id: mockConversionRuleIdThree,
    unit: mockCup,
    baseUnit: mockTeaspoon,
    baseUnitThreshold: 12,
    baseToUnitConversion: 48,
};
export const mockUnitConversionOne: UnitConversion = {
    __typename: 'UnitConversion',
    _id: mockUnitConversionIdOne,
    baseUnit: mockGram,
    rules: [mockConversionRuleOne],
};
export const mockUnitConversionTwo: UnitConversion = {
    __typename: 'UnitConversion',
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
            __typename: 'Query',
            unitConversionMany: [mockUnitConversionOne, mockUnitConversionTwo],
        } satisfies GetUnitConversionsQuery,
    },
};
