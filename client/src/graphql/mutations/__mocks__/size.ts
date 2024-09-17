import { DELETE_SIZE } from '@recipe/graphql/mutations/size';
import { mockExtraLargeId } from '@recipe/graphql/__mocks__/ids';
import { mockSmall } from '@recipe/graphql/queries/__mocks__/size';
import { CREATE_SIZE, MODIFY_SIZE } from '@recipe/graphql/mutations/size';
import { mockAdminId, mockReallyBigId } from '@recipe/graphql/__mocks__/ids';

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
        },
    },
    result: {
        data: {
            sizeCreateOne: {
                record: mockExtraLarge,
            },
        },
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
        },
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
        },
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
        },
    },
    result: {
        data: {
            sizeUpdateById: {
                record: {
                    ...mockSmall,
                    value: 'smaller',
                },
            },
        },
    },
};
export const mockDeleteSize = {
    request: {
        query: DELETE_SIZE,
        variables: {
            id: mockSmall._id,
        },
    },
    result: {
        data: {
            sizeRemoveById: {
                recordId: mockSmall._id,
            },
        },
    },
};
export const mockDeleteBespokeSize = {
    request: {
        query: DELETE_SIZE,
        variables: {
            id: mockReallyBigId,
        },
    },
    result: {
        data: {
            sizeRemoveById: {
                recordId: mockReallyBigId,
            },
        },
    },
};
