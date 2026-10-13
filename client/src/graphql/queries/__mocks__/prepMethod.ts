import { PrepMethod } from '@recipe/graphql/schema';
import { GetEditablePrepMethodsQuery } from '@recipe/graphql/generated';
import { mockAdminId, mockWholeId } from '@recipe/graphql/__mocks__/ids';
import { mockChoppedId, mockDicedId, mockSlicedId } from '@recipe/graphql/__mocks__/ids';

import { GET_EDITABLE_PREP_METHODS } from '../prepMethod';

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
export const mockGetEditablePrepMethods = {
    request: { query: GET_EDITABLE_PREP_METHODS },
    result: {
        data: {
            __typename: 'Query',
            prepMethodManyEditable: mockPrepMethods,
        } satisfies GetEditablePrepMethodsQuery,
    },
};
