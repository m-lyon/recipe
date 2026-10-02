import { ConversionRule } from '@recipe/graphql/schema';
import { GetUnitConversionsQuery } from '@recipe/graphql/generated';
import { mockConversionRuleIdThree } from '@recipe/graphql/__mocks__/ids';
import { GET_UNIT_CONVERSIONS } from '@recipe/graphql/queries/unitConversion';
import { mockConversionRuleIdOne, mockUnitConversionIdOne } from '@recipe/graphql/__mocks__/ids';
import { mockConversionRuleIdTwo, mockUnitConversionIdTwo } from '@recipe/graphql/__mocks__/ids';
import { mockConversionRuleIdFour, mockUnitConversionIdThree } from '@recipe/graphql/__mocks__/ids';

import { mockTeaspoon } from './unit';
import { mockCup, mockGram, mockKilogram, mockMilliliter, mockTablespoon } from './unit';

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
export const mockConversionRuleFour: ConversionRule = {
    __typename: 'ConversionRule',
    _id: mockConversionRuleIdFour,
    unit: mockCup,
    baseUnit: mockMilliliter,
    baseUnitThreshold: 50,
    baseToUnitConversion: 240,
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
export const mockUnitConversionVolume: UnitConversion = {
    __typename: 'UnitConversion',
    _id: mockUnitConversionIdThree,
    baseUnit: mockMilliliter,
    rules: [mockConversionRuleFour],
};
export const mockGetUnitConversions = {
    request: {
        query: GET_UNIT_CONVERSIONS,
    },
    result: {
        data: {
            __typename: 'Query',
            unitConversionMany: [
                mockUnitConversionOne,
                mockUnitConversionTwo,
                mockUnitConversionVolume,
            ],
        } satisfies GetUnitConversionsQuery,
    },
};
