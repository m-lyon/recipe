import { gql } from '../../__generated__';

export const GET_UNITS = gql(`
    query GetUnits($filter: FilterFindManyUnitInput) {
        unitMany(limit: 5000, filter: $filter) {
            _id
            shortSingular
            shortPlural
            longSingular
            longPlural
            preferredNumberFormat
            owner
            hasSpace
        }
    }
`);
