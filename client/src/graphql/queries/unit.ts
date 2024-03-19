import { gql } from '../../__generated__';

export const GET_UNITS = gql(`
    query GetUnits {
        unitMany(limit: 5000) {
            _id
            shortSingular
            shortPlural
            longSingular
            longPlural
            preferredNumberFormat
        }
    }
`);