import { mockTeaspoon } from '@recipe/graphql/queries/__mocks__/unit';
import { EnumUnitPreferredNumberFormat } from '@recipe/graphql/generated';
import { mockAdminId, mockCuttingId } from '@recipe/graphql/__mocks__/ids';
import { CREATE_UNIT, DELETE_UNIT, MODIFY_UNIT } from '@recipe/graphql/mutations/unit';

export const mockUnit = {
    __typename: 'Unit' as const,
    _id: mockCuttingId,
    longSingular: 'cutting',
    longPlural: 'cutting',
    shortSingular: 'cut',
    shortPlural: 'cut',
    preferredNumberFormat: 'decimal' as EnumUnitPreferredNumberFormat,
    hasSpace: true,
    unique: true,
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
                unique: mockTeaspoon.unique,
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
export const mockUpdateUnit = {
    request: {
        query: MODIFY_UNIT,
        variables: {
            id: mockTeaspoon._id,
            record: {
                longSingular: mockTeaspoon.longSingular,
                longPlural: 'teaspoonz',
                shortSingular: mockTeaspoon.shortSingular,
                shortPlural: mockTeaspoon.shortPlural,
                preferredNumberFormat: mockTeaspoon.preferredNumberFormat,
                unique: mockTeaspoon.unique,
                hasSpace: mockTeaspoon.hasSpace,
            },
        },
    },
    result: {
        data: {
            unitUpdateById: {
                record: {
                    ...mockTeaspoon,
                    longPlural: 'teaspoonz',
                },
            },
        },
    },
};
export const mockDeleteUnit = {
    request: {
        query: DELETE_UNIT,
        variables: {
            id: mockTeaspoon._id,
        },
    },
    result: {
        data: {
            unitRemoveById: {
                recordId: mockTeaspoon._id,
            },
        },
    },
};
