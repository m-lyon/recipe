import { CREATE_UNIT } from '@recipe/graphql/mutations/unit';
import { EnumUnitPreferredNumberFormat } from '@recipe/graphql/generated';
import { mockAdminId, mockCuttingId } from '@recipe/graphql/__mocks__/ids';

export const mockUnit = {
    __typename: 'Unit' as const,
    _id: mockCuttingId,
    longSingular: 'cutting',
    longPlural: 'cutting',
    shortSingular: 'cut',
    shortPlural: 'cut',
    preferredNumberFormat: 'decimal' as EnumUnitPreferredNumberFormat,
    hasSpace: true,
    owner: mockAdminId,
};

export const mockCreateUnit = {
    request: {
        query: CREATE_UNIT,
        variables: {
            record: {
                longSingular: mockUnit.longSingular,
                longPlural: mockUnit.longPlural,
                shortSingular: mockUnit.shortSingular,
                shortPlural: mockUnit.shortPlural,
                preferredNumberFormat: mockUnit.preferredNumberFormat,
                hasSpace: true,
            },
        },
    },
    result: {
        data: {
            unitCreateOne: {
                record: mockUnit,
            },
        },
    },
};
