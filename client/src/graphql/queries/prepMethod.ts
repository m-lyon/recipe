import { gql } from '../../__generated__';

export const PREP_METHOD_FIELDS = gql(`
    fragment PrepMethodFields on PrepMethod {
        _id
        value
    }
`);

export const PREP_METHOD_FIELDS_FULL = gql(`
    fragment PrepMethodFieldsFull on PrepMethod {
        ...PrepMethodFields
        owner
    }
`);

export const GET_PREP_METHODS = gql(`
    query GetPrepMethods($filter: FilterFindManyPrepMethodInput) {
        prepMethodMany(limit: 5000, filter: $filter) {
            ...PrepMethodFieldsFull
        }
    }
`);
