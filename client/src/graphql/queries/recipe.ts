import { gql } from '../../__generated__';

export const COUNT_RECIPES = gql(`
    query CountRecipes {
        recipeCount
    }
`);

export const RECIPE_FIELDS_SUBSET = gql(`
    fragment RecipeFieldsSubset on Recipe {
        _id
        title
        titleIdentifier
        tags {
            _id
            value
        }
        calculatedTags
        isIngredient
        numServings
        pluralTitle
        images {
            ...ImageFields
        }
    }
`);

export const RECIPE_FIELDS_FULL = gql(`
    fragment RecipeFieldsFull on Recipe {
        ...RecipeFieldsSubset
        instructions
        ingredients {
            type
            quantity
            unit {
                ...UnitFields
            }
            ingredient {
                ... on Recipe {
                    _id
                    title
                    pluralTitle
                }
                ... on Ingredient {
                    ...IngredientFields
                }
            }
            prepMethod {
                _id
                value
            }
        }
        source
        notes
    }
`);

export const GET_RECIPE = gql(`
    query GetRecipe($filter: FilterFindOneRecipeInput!) {
        recipeOne(filter: $filter) {
            ...RecipeFieldsFull
        }
    }
`);

export const GET_RECIPES = gql(`
    query GetRecipes($offset: Int = 0, $limit: Int = 1000) {
        recipeMany(skip: $offset, limit: $limit) {
            ...RecipeFieldsSubset
        }
    }
`);
