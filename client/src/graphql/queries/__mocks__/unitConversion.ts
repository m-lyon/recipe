import { GET_UNIT_CONVERSIONS } from '@recipe/graphql/queries/unitConversion';

import { mockGram, mockKilogram } from './unit';

export const mockGetUnitConversions = {
    request: {
        query: GET_UNIT_CONVERSIONS,
    },
    result: {
        data: {
            unitConversionMany: [
                {
                    _id: '60f4d2e5c3d5a0a4f1b9c0f1',
                    baseUnit: mockGram,
                    rules: [
                        {
                            _id: '60f4d2e5c3d5a0a4f1b9c0f8',
                            unit: mockKilogram,
                            baseUnitThreshold: 1000,
                            baseToUnitConversion: 1000,
                        },
                    ],
                },
            ],
        },
    },
};
