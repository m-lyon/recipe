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

export const ARCHIVE_RECIPE = gql(`
    mutation ArchiveRecipe($id: MongoID!) {
        recipeArchiveById(_id: $id) {
            recordId
        }
    }
`);

export const UNARCHIVE_RECIPE = gql(`
    mutation UnarchiveRecipe($id: MongoID!) {
        recipeUnarchiveById(_id: $id) {
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
