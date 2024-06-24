import { GET_PREP_METHODS } from '@recipe/graphql/queries/prepMethod';

export const mockChopped = {
    __typename: 'PrepMethod',
    _id: '60f4d2e5c3d5a0a4f1b9c0f7',
    value: 'chopped',
    owner: '60f4d2e5c3d5a0a4f1b9c0ec',
};
export const mockDiced = {
    __typename: 'PrepMethod' as const,
    _id: '60f4d2e5c3d5a0a4f1b9c0f8',
    value: 'diced',
    owner: '60f4d2e5c3d5a0a4f1b9c0ec',
};
export const mockSliced = {
    __typename: 'PrepMethod' as const,
    _id: '60f4d2e5c3d5a0a4f1b9c0fa',
    value: 'sliced',
    owner: '60f4d2e5c3d5a0a4f1b9c0ec',
};
export const mockWhole = {
    __typename: 'PrepMethod' as const,
    _id: '60f4d2e5c3d5a0a4f1b9c0fb',
    value: 'whole',
    owner: '60f4d2e5c3d5a0a4f1b9c0ec',
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
