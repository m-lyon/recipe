import { mockDiced } from '@recipe/graphql/queries/__mocks__/prepMethod';
import { DELETE_PREP_METHOD } from '@recipe/graphql/mutations/prepMethod';
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
        },
    },
    result: {
        data: {
            prepMethodCreateOne: {
                record: mockPipped,
            },
        },
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
        },
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
        },
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
        },
    },
    result: {
        data: {
            prepMethodUpdateById: {
                record: {
                    ...mockDiced,
                    value: 'dicey',
                },
            },
        },
    },
};
export const mockDeletePrepMethod = {
    request: {
        query: DELETE_PREP_METHOD,
        variables: {
            id: mockDiced._id,
        },
    },
    result: {
        data: {
            prepMethodRemoveById: {
                recordId: mockDiced._id,
            },
        },
    },
};
export const mockDeleteBespokePrepMethod = {
    request: {
        query: DELETE_PREP_METHOD,
        variables: {
            id: mockPostedId,
        },
    },
    result: {
        data: {
            prepMethodRemoveById: {
                recordId: mockPostedId,
            },
        },
    },
};
