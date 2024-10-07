import { CreatePrepMethodMutation } from '@recipe/graphql/generated';
import { ModifyPrepMethodMutation } from '@recipe/graphql/generated';
import { mockDiced } from '@recipe/graphql/queries/__mocks__/prepMethod';
import { DELETE_PREP_METHOD } from '@recipe/graphql/mutations/prepMethod';
import { ModifyPrepMethodMutationVariables } from '@recipe/graphql/generated';
import { DeletePrepMethodMutationVariables } from '@recipe/graphql/generated';
import { CreatePrepMethodMutationVariables } from '@recipe/graphql/generated';
import { DeletePrepMethodMutation, PrepMethod } from '@recipe/graphql/generated';
import { mockAdminId, mockPippedId, mockPostedId } from '@recipe/graphql/__mocks__/ids';
import { CREATE_PREP_METHOD, MODIFY_PREP_METHOD } from '@recipe/graphql/mutations/prepMethod';

export const mockPipped: PrepMethod = {
    _id: mockPippedId,
    __typename: 'PrepMethod',
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
            __typename: 'Mutation',
            prepMethodCreateOne: {
                __typename: 'CreateOnePrepMethodPayload',
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
            __typename: 'Mutation',
            prepMethodCreateOne: {
                __typename: 'CreateOnePrepMethodPayload',
                record: {
                    _id: mockPostedId,
                    __typename: 'PrepMethod',
                    value: 'posted',
                    unique: false,
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
            __typename: 'Mutation',
            prepMethodUpdateById: {
                __typename: 'UpdateByIdPrepMethodPayload',
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
            __typename: 'Mutation',
            prepMethodRemoveById: {
                __typename: 'RemoveByIdPrepMethodPayload',
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
            __typename: 'Mutation',
            prepMethodRemoveById: {
                __typename: 'RemoveByIdPrepMethodPayload',
                recordId: mockPostedId,
            },
        } satisfies DeletePrepMethodMutation,
    },
};
