import { mockTeaspoon } from '@recipe/graphql/queries/__mocks__/unit';
import { EnumUnitPreferredNumberFormat, Unit } from '@recipe/graphql/generated';
import { EnumUnitCreatePreferredNumberFormat } from '@recipe/graphql/generated';
import { mockAdminId, mockBumpId, mockCuttingId } from '@recipe/graphql/__mocks__/ids';
import { CREATE_UNIT, DELETE_UNIT, MODIFY_UNIT } from '@recipe/graphql/mutations/unit';
import { CreateUnitMutation, CreateUnitMutationVariables } from '@recipe/graphql/generated';
import { DeleteUnitMutation, DeleteUnitMutationVariables } from '@recipe/graphql/generated';
import { ModifyUnitMutation, ModifyUnitMutationVariables } from '@recipe/graphql/generated';

export const mockUnit: Unit = {
    __typename: 'Unit' as const,
    _id: mockCuttingId,
    longSingular: 'cutting',
    longPlural: 'cutting',
    shortSingular: 'cut',
    shortPlural: 'cut',
    preferredNumberFormat: EnumUnitPreferredNumberFormat.Decimal,
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
                preferredNumberFormat: EnumUnitCreatePreferredNumberFormat.Decimal,
                unique: mockTeaspoon.unique,
                hasSpace: true,
            },
        } satisfies CreateUnitMutationVariables,
    },
    result: {
        data: {
            unitCreateOne: {
                record: mockUnit,
            },
        } satisfies CreateUnitMutation,
    },
};
export const mockCreateBespokeUnit = {
    request: {
        query: CREATE_UNIT,
        variables: {
            record: {
                longSingular: 'bump',
                longPlural: 'bump',
                shortSingular: 'bump',
                shortPlural: 'bump',
                preferredNumberFormat: EnumUnitCreatePreferredNumberFormat.Decimal,
                unique: false,
                hasSpace: true,
            },
        } satisfies CreateUnitMutationVariables,
    },
    result: {
        data: {
            unitCreateOne: {
                record: {
                    __typename: 'Unit' as const,
                    _id: mockBumpId,
                    longSingular: 'bump',
                    longPlural: 'bump',
                    shortSingular: 'bump',
                    shortPlural: 'bump',
                    preferredNumberFormat: EnumUnitPreferredNumberFormat.Decimal,
                    hasSpace: true,
                    unique: false,
                    owner: mockAdminId,
                },
            },
        } satisfies CreateUnitMutation,
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
        } satisfies ModifyUnitMutationVariables,
    },
    result: {
        data: {
            unitUpdateById: {
                record: {
                    ...mockTeaspoon,
                    longPlural: 'teaspoonz',
                },
            },
        } satisfies ModifyUnitMutation,
    },
};
export const mockDeleteUnit = {
    request: {
        query: DELETE_UNIT,
        variables: {
            id: mockTeaspoon._id,
        } satisfies DeleteUnitMutationVariables,
    },
    result: {
        data: {
            unitRemoveById: {
                recordId: mockTeaspoon._id,
            },
        } satisfies DeleteUnitMutation,
    },
};
export const mockDeleteBespokeUnit = {
    request: {
        query: DELETE_UNIT,
        variables: {
            id: mockBumpId,
        } satisfies DeleteUnitMutationVariables,
    },
    result: {
        data: {
            unitRemoveById: {
                recordId: mockBumpId,
            },
        } satisfies DeleteUnitMutation,
    },
};
