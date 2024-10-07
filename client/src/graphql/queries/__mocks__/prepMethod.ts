import { PrepMethod } from '@recipe/graphql/generated';
import { mockAdminId, mockWholeId } from '@recipe/graphql/__mocks__/ids';
import { mockChoppedId, mockDicedId, mockSlicedId } from '@recipe/graphql/__mocks__/ids';
import { GetPrepMethodsQuery, GetPrepMethodsQueryVariables } from '@recipe/graphql/generated';

import { GET_PREP_METHODS } from '../prepMethod';

export const mockChopped: PrepMethod = {
    __typename: 'PrepMethod',
    _id: mockChoppedId,
    value: 'chopped',
    unique: true,
    owner: mockAdminId,
};
export const mockDiced: PrepMethod = {
    __typename: 'PrepMethod',
    _id: mockDicedId,
    value: 'diced',
    unique: true,
    owner: mockAdminId,
};
export const mockSliced: PrepMethod = {
    __typename: 'PrepMethod',
    _id: mockSlicedId,
    value: 'sliced',
    unique: true,
    owner: mockAdminId,
};
export const mockWhole: PrepMethod = {
    __typename: 'PrepMethod',
    _id: mockWholeId,
    value: 'whole',
    unique: true,
    owner: mockAdminId,
};
export const mockPrepMethods = [mockChopped, mockDiced, mockSliced, mockWhole];
export const mockGetPrepMethods = {
    request: {
        query: GET_PREP_METHODS,
        variables: { filter: {} } satisfies GetPrepMethodsQueryVariables,
    },
    result: {
        data: {
            __typename: 'Query',
            prepMethodMany: mockPrepMethods,
        } satisfies GetPrepMethodsQuery,
    },
};
