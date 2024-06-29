import { gql } from '../../__generated__';

export const COUNT_RECIPES = gql(`
    query CountRecipes {
        recipeCount
    }
`);

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
                recipe {
                    title
                }
            }
        }
    }
`);

export const GET_RECIPES = gql(`
    query GetRecipes($offset: Int = 0, $limit: Int = 1000) {
        recipeMany(skip: $offset, limit: $limit) {
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
                recipe {
                    title
                }
            }
        }
    }
`);
