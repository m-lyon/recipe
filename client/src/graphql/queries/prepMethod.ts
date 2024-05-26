import { gql } from '../../__generated__';

export const GET_PREP_METHODS = gql(`
    query GetPrepMethods($filter: FilterFindManyPrepMethodInput) {
        prepMethodMany(limit: 5000, filter: $filter) {
            _id
            value
            owner
        }
    }
`);
