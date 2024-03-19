import { gql } from '../../__generated__/gql';

export const GET_PREP_METHODS = gql(`
    query GetPrepMethods {
        prepMethodMany(limit: 5000) {
            _id
            value
        }
    }
`);