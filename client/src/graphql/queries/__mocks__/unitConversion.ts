import { GET_UNIT_CONVERSIONS } from '@recipe/graphql/queries/unitConversion';
import { mockConversionRuleIdOne, mockUnitConversionIdOne } from '@recipe/graphql/__mocks__/ids';
import { mockConversionRuleIdTwo, mockUnitConversionIdTwo } from '@recipe/graphql/__mocks__/ids';

import { mockGram, mockKilogram, mockTablespoon, mockTeaspoon } from './unit';

export const mockConversionRuleOne = {
    __typename: 'UnitConversionRule' as const,
    _id: mockConversionRuleIdOne,
    unit: mockKilogram,
    baseUnitThreshold: 1000,
    baseToUnitConversion: 1000,
};
export const mockConversionRuleTwo = {
    __typename: 'UnitConversionRule' as const,
    _id: mockConversionRuleIdTwo,
    unit: mockTablespoon,
    baseUnitThreshold: 3,
    baseToUnitConversion: 3,
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
    rules: [mockConversionRuleTwo],
};
export const mockGetUnitConversions = {
    request: {
        query: GET_UNIT_CONVERSIONS,
    },
    result: {
        data: {
            unitConversionMany: [mockUnitConversionOne, mockUnitConversionTwo],
        },
    },
};
