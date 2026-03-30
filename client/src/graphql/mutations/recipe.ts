import { gql } from '../../__generated__';

export const UPDATE_RECIPE = gql(`
mutation UpdateRecipe($id: MongoID!, $recipe: UpdateByIdRecipeModifyInput!) {
    recipeUpdateById(_id: $id, record: $recipe) {
        record {
            ...RecipeFieldsFull
        }
    }
}
`);

export const CREATE_RECIPE = gql(`
    mutation CreateRecipe($recipe: CreateOneRecipeCreateInput!) {
        recipeCreateOne(record: $recipe) {
            record {
                ...RecipeFieldsFull
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

export const MAKE_VEGAN_RECIPE = gql(`
    mutation MakeVeganRecipe($originalId: MongoID!) {
        recipeMakeVegan(originalId: $originalId) {
            record {
                _id
                title
                titleIdentifier
                originalRecipe {
                    _id
                    title
                    titleIdentifier
                }
            }
        }
    }
`);
