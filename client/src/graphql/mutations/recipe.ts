import { gql } from '../../__generated__';

export const UPDATE_RECIPE = gql(`
mutation UpdateRecipe($id: MongoID!, $recipe: UpdateByIdRecipeModifyInput!) {
    recipeUpdateById(_id: $id, record: $recipe) {
        record {
            _id
            title
        }
    }
}
`);

export const CREATE_RECIPE = gql(`
    mutation CreateRecipe($recipe: CreateOneRecipeModifyInput!) {
        recipeCreateOne(record: $recipe) {
            record {
                _id
                title
            }
        }
    }
`);

export const DELETE_RECIPE = gql(`
    mutation DeleteRecipe($id: MongoID!) {
        recipeRemoveById(_id: $id) {
            recordId
        }
    }
`);
