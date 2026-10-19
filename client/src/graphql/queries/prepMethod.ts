import { gql } from '../../__generated__';

export const PREP_METHOD_FIELDS = gql(`
    fragment PrepMethodFields on PrepMethod {
        _id
        value
        unique
    }
`);

export const GET_EDITABLE_PREP_METHODS = gql(`
    query GetEditablePrepMethods {
        prepMethodManyEditable(limit: 5000) {
            ...PrepMethodFields
            owner {
                _id
                firstName
                lastName
            }
        }
    }
`);
