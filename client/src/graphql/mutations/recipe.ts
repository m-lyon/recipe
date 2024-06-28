import { gql } from '../../__generated__';

export const UPDATE_RECIPE = gql(`
mutation UpdateRecipe($id: MongoID!, $recipe: UpdateByIdRecipeModifyInput!) {
    recipeUpdateById(_id: $id, record: $recipe) {
        record {
            _id
            title
            titleIdentifier
            instructions
            ingredients {
                type
                quantity
                unit {
                    _id
                    shortSingular
                    shortPlural
                    longSingular
                    longPlural
                    preferredNumberFormat
                    hasSpace
                }
                ingredient {
                    ... on Recipe {
                        _id
                        title
                        pluralTitle
                    }
                    ... on Ingredient {
                        _id
                        name
                        pluralName
                        isCountable
                    }
                }
                prepMethod {
                    _id
                    value
                }
            }
            tags {
                _id
                value
            }
            calculatedTags
            numServings
            isIngredient
            pluralTitle
            source
            notes
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
                title
                instructions
                ingredients {
                    type
                    quantity
                    unit {
                        _id
                        shortSingular
                        shortPlural
                        longSingular
                        longPlural
                        preferredNumberFormat
                        hasSpace
                    }
                    ingredient {
                        ... on Recipe {
                            _id
                            title
                            pluralTitle
                        }
                        ... on Ingredient {
                            _id
                            name
                            pluralName
                            isCountable
                        }
                    }
                    prepMethod {
                        _id
                        value
                    }
                }
                tags {
                    _id
                    value
                }
                calculatedTags
                numServings
                isIngredient
                pluralTitle
                source
                notes
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
