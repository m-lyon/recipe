import { gql } from '../../__generated__';

export const GET_RECIPE = gql(`
    query GetRecipe($filter: FilterFindOneRecipeInput!) {
        recipeOne(filter: $filter) {
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
`);

export const GET_RECIPES = gql(`
    query GetRecipes {
        recipeMany {
            _id
            titleIdentifier
            title
            tags {
                _id
                value
            }
            isIngredient
            numServings
            pluralTitle
            images {
                origUrl
            }
        }
    }
`);
