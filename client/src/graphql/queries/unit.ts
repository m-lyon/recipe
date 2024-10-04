import { gql } from '../../__generated__';

export const UNIT_FIELDS = gql(`
    fragment UnitFields on Unit {
        _id
        shortSingular
        shortPlural
        longSingular
        longPlural
        preferredNumberFormat
        hasSpace
        unique
    }
`);

export const GET_UNITS = gql(`
    query GetUnits($filter: FilterFindManyUnitInput) {
        unitMany(limit: 5000, filter: $filter) {
            ...UnitFields
        }
    }
`);
