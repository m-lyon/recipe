import { GetPrepMethodsQuery } from '@recipe/graphql/generated';
import { mockAdminId, mockWholeId } from '@recipe/graphql/__mocks__/ids';
import { mockChoppedId, mockDicedId, mockSlicedId } from '@recipe/graphql/__mocks__/ids';

import { GET_PREP_METHODS } from '../prepMethod';

export const mockChopped = {
    __typename: 'PrepMethod' as const,
    _id: mockChoppedId,
    value: 'chopped',
    unique: true,
    owner: mockAdminId,
};
export const mockDiced = {
    __typename: 'PrepMethod' as const,
    _id: mockDicedId,
    value: 'diced',
    unique: true,
    owner: mockAdminId,
};
export const mockSliced = {
    __typename: 'PrepMethod' as const,
    _id: mockSlicedId,
    value: 'sliced',
    unique: true,
    owner: mockAdminId,
};
export const mockWhole = {
    __typename: 'PrepMethod' as const,
    _id: mockWholeId,
    value: 'whole',
    unique: true,
    owner: mockAdminId,
};
export const mockPrepMethods = [mockChopped, mockDiced, mockSliced, mockWhole];
export const mockGetPrepMethods = {
    request: { query: GET_PREP_METHODS },
    result: { data: { prepMethodMany: mockPrepMethods } satisfies GetPrepMethodsQuery },
};
