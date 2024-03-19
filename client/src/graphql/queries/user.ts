import { gql } from '../../__generated__';

export const CURRENT_USER = gql(`
    query CurrentUser {
        currentUser {
            _id
            role
            firstName
            lastName
        }
    }
`);