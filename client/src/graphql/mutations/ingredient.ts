import { gql } from '../../__generated__';

export const CREATE_INGREDIENT = gql(`
    mutation CreateIngredient($record: CreateOneIngredientCreateInput!) {
        ingredientCreateOne(record: $record) {
            record {
                ...IngredientFieldsFull
            }
        }
    }
`);

export const MODIFY_INGREDIENT = gql(`
    mutation ModifyIngredient($id: MongoID!, $record: UpdateByIdIngredientInput!) {
        ingredientUpdateById(_id: $id, record: $record) {
            record {
                ...IngredientFieldsFull
            }
        }
    }
`);

export const DELETE_INGREDIENT = gql(`
    mutation DeleteIngredient($id: MongoID!) {
        ingredientRemoveById(_id: $id) {
            recordId
        }
    }
`);
