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
        dimension
        perCanonical
        system
        hidden
        standard
    }
`);

export const GET_UNITS = gql(`
    query GetUnits {
        unitMany(limit: 5000) {
            ...UnitFields
        }
    }
`);

export const GET_EDITABLE_UNITS = gql(`
    query GetEditableUnits {
        unitManyEditable(limit: 5000) {
            ...UnitFields
            owner {
                _id
                firstName
                lastName
            }
        }
    }
`);
