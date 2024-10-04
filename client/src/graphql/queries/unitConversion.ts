import { gql } from '../../__generated__';

export const GET_UNIT_CONVERSIONS = gql(`
    query GetUnitConversions {
        unitConversionMany(limit: 5000) {
            _id
            baseUnit {
                ...UnitFields
            }
            rules(sort: THRESHOLD_DESC) {
                _id
                baseUnitThreshold
                baseToUnitConversion
                unit {
                    ...UnitFields
                }
            }
        }
    }
`);
