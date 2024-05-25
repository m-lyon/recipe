import { gql } from '../../__generated__';

export const CREATE_CONVERSION_RULE = gql(`
    mutation CreateConversionRule($record: CreateOneConversionRuleInput!) {
        conversionRuleCreateOne(record: $record) {
            record {
                _id
                baseUnitThreshold
                baseToUnitConversion
                unit {
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
    }
`);

export const REMOVE_CONVERSION_RULE = gql(`
    mutation RemoveConversionRule($id: MongoID!) {
        conversionRuleRemoveById(_id: $id) {
            recordId
        }
    }
`);

export const CREATE_UNIT_CONVERSION = gql(`
    mutation CreateUnitConversion($record: CreateOneUnitConversionInput!) {
        unitConversionCreateOne(record: $record) {
            recordId
        }
    }
`);
