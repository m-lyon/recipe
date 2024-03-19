import { gql } from '../../__generated__';

export const CREATE_INGREDIENT = gql(`
    mutation CreateIngredient($record: CreateOneIngredientInput!) {
        ingredientCreateOne(record: $record) {
            record {
                _id
                name
                pluralName
                isCountable
            }
        }
    }
`);