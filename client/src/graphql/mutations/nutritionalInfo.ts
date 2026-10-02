import { gql } from '../../__generated__';

export const CREATE_NUTRITIONAL_INFO = gql(`
    mutation CreateNutritionalInfo($record: CreateOneNutritionalInfoCreateInput!) {
        nutritionalInfoCreateOne(record: $record) {
            record {
                _id
                ingredient
                usdaFdcId
                perGram { calories protein carbs fat }
                perUnit { calories protein carbs fat }
            }
        }
    }
`);

export const UPDATE_NUTRITIONAL_INFO = gql(`
    mutation UpdateNutritionalInfo($_id: MongoID!, $record: UpdateByIdNutritionalInfoInput!) {
        nutritionalInfoUpdateById(_id: $_id, record: $record) {
            record {
                _id
                ingredient
                usdaFdcId
                perGram { calories protein carbs fat }
                perUnit { calories protein carbs fat }
            }
        }
    }
`);

export const DELETE_NUTRITIONAL_INFO = gql(`
    mutation DeleteNutritionalInfo($_id: MongoID!) {
        nutritionalInfoRemoveById(_id: $_id) {
            recordId
        }
    }
`);
