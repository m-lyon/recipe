import { DELETE_SIZE } from '@recipe/graphql/mutations/size';
import { mockExtraLargeId } from '@recipe/graphql/__mocks__/ids';
import { mockSmall } from '@recipe/graphql/queries/__mocks__/size';
import { CREATE_SIZE, MODIFY_SIZE } from '@recipe/graphql/mutations/size';
import { mockAdminId, mockReallyBigId } from '@recipe/graphql/__mocks__/ids';
import { CreateSizeMutation, CreateSizeMutationVariables } from '@recipe/graphql/generated';
import { ModifySizeMutation, ModifySizeMutationVariables } from '@recipe/graphql/generated';
import { DeleteSizeMutation, DeleteSizeMutationVariables } from '@recipe/graphql/generated';

export const mockExtraLarge = {
    _id: mockExtraLargeId,
    __typename: 'Size' as const,
    value: 'extra large',
    unique: true,
    owner: mockAdminId,
};
export const mockCreateSize = {
    request: {
        query: CREATE_SIZE,
        variables: {
            record: {
                value: mockExtraLarge.value,
                unique: mockExtraLarge.unique,
            },
        } satisfies CreateSizeMutationVariables,
    },
    result: {
        data: {
            sizeCreateOne: {
                record: mockExtraLarge,
            },
        } satisfies CreateSizeMutation,
    },
};
export const mockCreateBespokeSize = {
    request: {
        query: CREATE_SIZE,
        variables: {
            record: {
                value: 'really big',
                unique: false,
            },
        } satisfies CreateSizeMutationVariables,
    },
    result: {
        data: {
            sizeCreateOne: {
                record: {
                    _id: mockReallyBigId,
                    __typename: 'Size' as const,
                    value: 'really big',
                    unique: false,
                    owner: mockAdminId,
                },
            },
        } satisfies CreateSizeMutation,
    },
};
export const mockUpdateSize = {
    request: {
        query: MODIFY_SIZE,
        variables: {
            id: mockSmall._id,
            record: {
                value: 'smaller',
                unique: true,
            },
        } satisfies ModifySizeMutationVariables,
    },
    result: {
        data: {
            sizeUpdateById: {
                record: {
                    ...mockSmall,
                    value: 'smaller',
                },
            },
        } satisfies ModifySizeMutation,
    },
};
export const mockDeleteSize = {
    request: {
        query: DELETE_SIZE,
        variables: {
            id: mockSmall._id,
        } satisfies DeleteSizeMutationVariables,
    },
    result: {
        data: {
            sizeRemoveById: {
                recordId: mockSmall._id,
            },
        } satisfies DeleteSizeMutation,
    },
};
export const mockDeleteBespokeSize = {
    request: {
        query: DELETE_SIZE,
        variables: {
            id: mockReallyBigId,
        } satisfies DeleteSizeMutationVariables,
    },
    result: {
        data: {
            sizeRemoveById: {
                recordId: mockReallyBigId,
            },
        } satisfies DeleteSizeMutation,
    },
};
