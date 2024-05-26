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

export const MODIFY_INGREDIENT = gql(`
    mutation ModifyIngredient($id: MongoID!, $record: UpdateByIdIngredientInput!) {
        ingredientUpdateById(_id: $id, record: $record) {
            record {
                _id
                name
                pluralName
                isCountable
            }
        }
    }
`);
