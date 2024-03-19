import { gql } from '../../__generated__';

export const LOGIN = gql(`
    mutation Login($email: String!, $password: String!) {
        login(username: $email, password: $password) {
            _id
            role
            firstName
            lastName
        }
    }
`);

export const LOGOUT = gql(`
    mutation Logout {
        logout
    }
`);

export const SIGNUP = gql(`
    mutation Signup($email: String!, $password: String!, $firstName: String!, $lastName: String!) {
        register(username: $email, password: $password, firstName: $firstName, lastName: $lastName) {
            _id
            role
            firstName
            lastName
        }
    }
`);