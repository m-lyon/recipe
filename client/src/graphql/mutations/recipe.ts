import { gql } from '../../__generated__';

export const UPDATE_RECIPE = gql(`
mutation UpdateRecipe($id: MongoID!, $recipe: UpdateByIdRecipeModifyInput!) {
    recipeUpdateById(_id: $id, record: $recipe) {
        record {
            _id
            titleIdentifier
            title
            tags {
                _id
                value
            }
            calculatedTags
            isIngredient
            numServings
            pluralTitle
            images {
                _id
                origUrl
            }
        }
    }
}
`);

export const CREATE_RECIPE = gql(`
    mutation CreateRecipe($recipe: CreateOneRecipeCreateInput!) {
        recipeCreateOne(record: $recipe) {
            record {
                _id
                titleIdentifier
                title
                tags {
                    _id
                    value
                }
                calculatedTags
                isIngredient
                numServings
                pluralTitle
                images {
                    _id
                    origUrl
                }
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
