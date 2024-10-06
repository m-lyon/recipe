import { ModifyUnitMutation } from '@recipe/graphql/generated';
import { mockTeaspoon } from '@recipe/graphql/queries/__mocks__/unit';
import { ModifyUnitMutationVariables, Unit } from '@recipe/graphql/generated';
import { mockAdminId, mockBumpId, mockCuttingId } from '@recipe/graphql/__mocks__/ids';
import { CREATE_UNIT, DELETE_UNIT, MODIFY_UNIT } from '@recipe/graphql/mutations/unit';
import { CreateUnitMutation, CreateUnitMutationVariables } from '@recipe/graphql/generated';
import { DeleteUnitMutation, DeleteUnitMutationVariables } from '@recipe/graphql/generated';

export const mockUnit: Unit = {
    __typename: 'Unit' as const,
    _id: mockCuttingId,
    longSingular: 'cutting',
    longPlural: 'cutting',
    shortSingular: 'cut',
    shortPlural: 'cut',
    preferredNumberFormat: 'decimal',
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
                preferredNumberFormat: 'decimal',
                unique: mockTeaspoon.unique,
                hasSpace: true,
            },
        } satisfies CreateUnitMutationVariables,
    },
    result: {
        data: {
            __typename: 'Mutation',
            unitCreateOne: {
                __typename: 'CreateOneUnitPayload',
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
                preferredNumberFormat: 'decimal',
                unique: false,
                hasSpace: true,
            },
        } satisfies CreateUnitMutationVariables,
    },
    result: {
        data: {
            __typename: 'Mutation',
            unitCreateOne: {
                __typename: 'CreateOneUnitPayload',
                record: {
                    __typename: 'Unit' as const,
                    _id: mockBumpId,
                    longSingular: 'bump',
                    longPlural: 'bump',
                    shortSingular: 'bump',
                    shortPlural: 'bump',
                    preferredNumberFormat: 'decimal',
                    hasSpace: true,
                    unique: false,
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
            __typename: 'Mutation',
            unitUpdateById: {
                __typename: 'UpdateByIdUnitPayload',
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
            __typename: 'Mutation',
            unitRemoveById: {
                __typename: 'RemoveByIdUnitPayload',
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
            __typename: 'Mutation',
            unitRemoveById: {
                __typename: 'RemoveByIdUnitPayload',
                recordId: mockBumpId,
            },
        } satisfies DeleteUnitMutation,
    },
};
