import { gql } from '../../__generated__';

export const CREATE_UNIT = gql(`
    mutation CreateUnit($record: CreateOneUnitInput!) {
        unitCreateOne(record: $record) {
            record {
                _id
                longSingular
                longPlural
                shortSingular
                shortPlural
                preferredNumberFormat
                hasSpace
            }
        }
    }
`);