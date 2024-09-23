import { DeletePrepMethodMutation } from '@recipe/graphql/generated';
import { CreatePrepMethodMutation } from '@recipe/graphql/generated';
import { ModifyPrepMethodMutation } from '@recipe/graphql/generated';
import { mockDiced } from '@recipe/graphql/queries/__mocks__/prepMethod';
import { DELETE_PREP_METHOD } from '@recipe/graphql/mutations/prepMethod';
import { ModifyPrepMethodMutationVariables } from '@recipe/graphql/generated';
import { DeletePrepMethodMutationVariables } from '@recipe/graphql/generated';
import { CreatePrepMethodMutationVariables } from '@recipe/graphql/generated';
import { mockAdminId, mockPippedId, mockPostedId } from '@recipe/graphql/__mocks__/ids';
import { CREATE_PREP_METHOD, MODIFY_PREP_METHOD } from '@recipe/graphql/mutations/prepMethod';

export const mockPipped = {
    _id: mockPippedId,
    __typename: 'PrepMethod' as const,
    value: 'pipped',
    unique: true,
    owner: mockAdminId,
};
export const mockCreatePrepMethod = {
    request: {
        query: CREATE_PREP_METHOD,
        variables: {
            record: {
                value: mockPipped.value,
                unique: mockPipped.unique,
            },
        } satisfies CreatePrepMethodMutationVariables,
    },
    result: {
        data: {
            prepMethodCreateOne: {
                record: mockPipped,
            },
        } satisfies CreatePrepMethodMutation,
    },
};
export const mockCreateBespokePrepMethod = {
    request: {
        query: CREATE_PREP_METHOD,
        variables: {
            record: {
                value: 'posted',
                unique: false,
            },
        } satisfies CreatePrepMethodMutationVariables,
    },
    result: {
        data: {
            prepMethodCreateOne: {
                record: {
                    _id: mockPostedId,
                    __typename: 'PrepMethod' as const,
                    value: 'posted',
                    unique: false,
                    owner: mockAdminId,
                },
            },
        } satisfies CreatePrepMethodMutation,
    },
};
export const mockUpdatePrepMethod = {
    request: {
        query: MODIFY_PREP_METHOD,
        variables: {
            id: mockDiced._id,
            record: {
                value: 'dicey',
                unique: true,
            },
        } satisfies ModifyPrepMethodMutationVariables,
    },
    result: {
        data: {
            prepMethodUpdateById: {
                record: {
                    ...mockDiced,
                    value: 'dicey',
                },
            },
        } satisfies ModifyPrepMethodMutation,
    },
};
export const mockDeletePrepMethod = {
    request: {
        query: DELETE_PREP_METHOD,
        variables: {
            id: mockDiced._id,
        } satisfies DeletePrepMethodMutationVariables,
    },
    result: {
        data: {
            prepMethodRemoveById: {
                recordId: mockDiced._id,
            },
        } satisfies DeletePrepMethodMutation,
    },
};
export const mockDeleteBespokePrepMethod = {
    request: {
        query: DELETE_PREP_METHOD,
        variables: {
            id: mockPostedId,
        } satisfies DeletePrepMethodMutationVariables,
    },
    result: {
        data: {
            prepMethodRemoveById: {
                recordId: mockPostedId,
            },
        } satisfies DeletePrepMethodMutation,
    },
};
