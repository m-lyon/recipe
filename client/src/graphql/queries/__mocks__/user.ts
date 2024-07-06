import { mockAdminId } from '@recipe/graphql/__mocks__/ids';
import { CURRENT_USER } from '@recipe/graphql/queries/user';

export const mockAdmin = {
    __typename: 'User' as const,
    _id: mockAdminId,
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
