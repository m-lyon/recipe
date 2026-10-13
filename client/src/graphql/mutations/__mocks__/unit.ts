import { Unit } from '@recipe/graphql/schema';
import { ModifyUnitMutation } from '@recipe/graphql/generated';
import { mockUnits } from '@recipe/graphql/queries/__mocks__/unit';
import { ModifyUnitMutationVariables } from '@recipe/graphql/generated';
import { mockAdminId, mockBumpId, mockCuttingId } from '@recipe/graphql/__mocks__/ids';
import { CREATE_UNIT, DELETE_UNIT, MODIFY_UNIT } from '@recipe/graphql/mutations/unit';
import { CreateUnitMutation, CreateUnitMutationVariables } from '@recipe/graphql/generated';
import { DeleteUnitMutation, DeleteUnitMutationVariables } from '@recipe/graphql/generated';
import { mockGetEditableUnits, mockTeaspoon } from '@recipe/graphql/queries/__mocks__/unit';

export const mockUnit: Unit = {
    __typename: 'Unit',
    _id: mockCuttingId,
    longSingular: 'cutting',
    longPlural: 'cutting',
    shortSingular: 'cut',
    shortPlural: 'cut',
    preferredNumberFormat: 'decimal',
    hasSpace: true,
    unique: true,
    owner: mockAdminId,
    dimension: 'count',
    perCanonical: 1,
    system: null,
    hidden: false,
    standard: null,
};
/** The units list with one unit that is not standard, so it can be edited and deleted. */
export const mockGetEditableUnitsWithCutting = {
    ...mockGetEditableUnits,
    result: {
        data: { __typename: 'Query' as const, unitManyEditable: [...mockUnits, mockUnit] },
    },
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
                dimension: 'count',
                perCanonical: 1,
                system: null,
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
                dimension: 'count',
                perCanonical: 1,
                system: null,
            },
        } satisfies CreateUnitMutationVariables,
    },
    result: {
        data: {
            __typename: 'Mutation',
            unitCreateOne: {
                __typename: 'CreateOneUnitPayload',
                record: {
                    __typename: 'Unit',
                    _id: mockBumpId,
                    longSingular: 'bump',
                    longPlural: 'bump',
                    shortSingular: 'bump',
                    shortPlural: 'bump',
                    preferredNumberFormat: 'decimal',
                    hasSpace: true,
                    unique: false,
                    dimension: 'count',
                    perCanonical: 1,
                    system: null,
                    hidden: false,
                    standard: null,
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
                dimension: mockTeaspoon.dimension,
                perCanonical: mockTeaspoon.perCanonical,
                system: mockTeaspoon.system,
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
            id: mockUnit._id,
        } satisfies DeleteUnitMutationVariables,
    },
    result: {
        data: {
            __typename: 'Mutation',
            unitRemoveById: {
                __typename: 'RemoveByIdUnitPayload',
                recordId: mockUnit._id,
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
