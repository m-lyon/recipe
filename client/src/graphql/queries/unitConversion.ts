import { gql } from '../../__generated__';

export const GET_UNIT_CONVERSIONS = gql(`
    query GetUnitConversions {
        unitConversionMany(limit: 5000) {
            baseUnit {
                _id
            }
            rules {
                _id
                threshold
                baseConversion
                unit {
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
        }
    }
`);
