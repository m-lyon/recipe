import { GET_UNIT_CONVERSIONS } from '@recipe/graphql/queries/unitConversion';
import { mockConversionRuleId, mockUnitConversionId } from '@recipe/graphql/__mocks__/ids';

import { mockGram, mockKilogram } from './unit';

export const mockConversionRule = {
    __typename: 'UnitConversionRule' as const,
    _id: mockConversionRuleId,
    unit: mockKilogram,
    baseUnitThreshold: 1000,
    baseToUnitConversion: 1000,
};

export const mockUnitConversion = {
    __typename: 'UnitConversion' as const,
    _id: mockUnitConversionId,
    baseUnit: mockGram,
    rules: [mockConversionRule],
};

export const mockGetUnitConversions = {
    request: {
        query: GET_UNIT_CONVERSIONS,
    },
    result: {
        data: {
            unitConversionMany: [mockUnitConversion],
        },
    },
};
