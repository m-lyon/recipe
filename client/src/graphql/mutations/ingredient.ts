import { gql } from '../../__generated__';

export const CREATE_INGREDIENT = gql(`
    mutation CreateIngredient($record: CreateOneIngredientCreateInput!) {
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
