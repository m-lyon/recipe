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

export const UPDATE_UNIT_CONVERSION = gql(`
    mutation UpdateUnitConversion($id: MongoID!, $record: UpdateByIdUnitConversionInput!) {
        unitConversionUpdateById(_id: $id, record: $record) {
            record {
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
    }
`);

export const REMOVE_UNIT_CONVERSION = gql(`
    mutation RemoveUnitConversion($id: MongoID!) {
        unitConversionRemoveById(_id: $id) {
            recordId
        }
    }
`);
