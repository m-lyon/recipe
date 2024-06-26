import { CURRENT_USER } from '@recipe/graphql/queries/user';

export const mockAdmin = {
    __typename: 'User' as const,
    _id: '60f4d2e5c3d5a0a4f1b9c0eb',
    role: 'admin',
    firstName: 'Mock',
    lastName: 'User',
};

export const mockGetCurrentUser = {
    request: {
        query: CURRENT_USER,
    },
    result: {
        data: {
            currentUser: mockAdmin,
        },
    },
};
