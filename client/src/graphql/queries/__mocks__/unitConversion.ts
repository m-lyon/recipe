import { GET_UNIT_CONVERSIONS } from '@recipe/graphql/queries/unitConversion';

export const mockGetUnitConversions = {
    request: {
        query: GET_UNIT_CONVERSIONS,
    },
    result: {
        data: {
            unitConversionMany: [
                {
                    _id: '60f4d2e5c3d5a0a4f1b9c0f1',
                    baseUnit: {
                        _id: '60f4d2e5c3d5a0a4f1b9c0f3',
                        shortSingular: 'g',
                        shortPlural: 'g',
                        longSingular: 'gram',
                        longPlural: 'grams',
                        preferredNumberFormat: 'decimal',
                        owner: '60f4d2e5c3d5a0a4f1b9c0ec',
                        hasSpace: false,
                    },
                    rules: [
                        {
                            _id: '60f4d2e5c3d5a0a4f1b9c0f8',
                            unit: {
                                _id: '60f4d2e5c3d5a0a4f1b9c0f5',
                                shortSingular: 'kg',
                                shortPlural: 'kg',
                                longSingular: 'kilogram',
                                longPlural: 'kilograms',
                                preferredNumberFormat: 'decimal',
                                owner: '60f4d2e5c3d5a0a4f1b9c0ec',
                                hasSpace: false,
                            },
                            baseUnitThreshold: 1000,
                            baseToUnitConversion: 1000,
                        },
                    ],
                },
            ],
        },
    },
};
