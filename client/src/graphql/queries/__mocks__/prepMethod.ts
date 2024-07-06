import { GET_PREP_METHODS } from '@recipe/graphql/queries/prepMethod';
import { mockAdminId, mockWholeId } from '@recipe/graphql/__mocks__/ids';
import { mockChoppedId, mockDicedId, mockSlicedId } from '@recipe/graphql/__mocks__/ids';

export const mockChopped = {
    __typename: 'PrepMethod',
    _id: mockChoppedId,
    value: 'chopped',
    owner: mockAdminId,
};
export const mockDiced = {
    __typename: 'PrepMethod' as const,
    _id: mockDicedId,
    value: 'diced',
    owner: mockAdminId,
};
export const mockSliced = {
    __typename: 'PrepMethod' as const,
    _id: mockSlicedId,
    value: 'sliced',
    owner: mockAdminId,
};
export const mockWhole = {
    __typename: 'PrepMethod' as const,
    _id: mockWholeId,
    value: 'whole',
    owner: mockAdminId,
};

export const mockGetPrepMethods = {
    request: {
        query: GET_PREP_METHODS,
    },
    result: {
        data: {
            prepMethodMany: [mockChopped, mockDiced, mockSliced, mockWhole],
        },
    },
};
