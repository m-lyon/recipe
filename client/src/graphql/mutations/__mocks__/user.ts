import { mockAdmin } from '@recipe/graphql/queries/__mocks__/user';
import { LoginMutation, LoginMutationVariables, LogoutMutation } from '@recipe/graphql/generated';

import { LOGIN, LOGOUT } from '../user';

export const mockLogin = {
    request: {
        query: LOGIN,
        variables: {
            email: 'test@gmail.com',
            password: 'password',
        } satisfies LoginMutationVariables,
    },
    result: {
        data: {
            login: mockAdmin,
        } satisfies LoginMutation,
    },
};

export const mockLogout = {
    request: {
        query: LOGOUT,
    },
    result: {
        data: {
            logout: true,
        } satisfies LogoutMutation,
    },
};
