import { mockAdminId } from '@recipe/graphql/__mocks__/ids';
import { CURRENT_USER } from '@recipe/graphql/queries/user';
import { CurrentUserQuery, User } from '@recipe/graphql/generated';

export const mockAdmin: User = {
    __typename: 'User',
    _id: mockAdminId,
    role: 'admin',
    username: 'admin',
    firstName: 'Mock',
    lastName: 'User',
};

export const mockUser: User = {
    __typename: 'User',
    _id: 'mockUserId',
    role: 'user',
    username: 'user',
    firstName: 'Mock',
    lastName: 'User',
};

export const mockCurrentUserAdmin = {
    request: {
        query: CURRENT_USER,
    },
    result: {
        data: {
            __typename: 'Query',
            currentUser: mockAdmin,
        } satisfies CurrentUserQuery,
    },
};

export const mockCurrentUser = {
    request: {
        query: CURRENT_USER,
    },
    result: {
        data: {
            __typename: 'Query',
            currentUser: mockUser,
        } satisfies CurrentUserQuery,
    },
};

export const mockCurrentUserNull = {
    request: {
        query: CURRENT_USER,
    },
    result: {
        data: {
            __typename: 'Query',
            currentUser: null,
        } satisfies CurrentUserQuery,
    },
};
