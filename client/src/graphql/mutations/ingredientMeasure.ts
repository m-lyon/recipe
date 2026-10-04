import { gql } from '../../__generated__';

export const CREATE_INGREDIENT_MEASURE = gql(`
    mutation CreateIngredientMeasure($record: CreateOneIngredientMeasureInput!) {
        ingredientMeasureCreateOne(record: $record) {
            record {
                ...IngredientMeasureFields
            }
        }
    }
`);

export const REMOVE_INGREDIENT_MEASURE = gql(`
    mutation RemoveIngredientMeasure($id: MongoID!) {
        ingredientMeasureRemoveById(_id: $id) {
            recordId
        }
    }
`);
