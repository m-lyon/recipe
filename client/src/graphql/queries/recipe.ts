import { gql } from '../../__generated__';

export const COUNT_RECIPES = gql(`
    query CountRecipes {
        recipeCount
    }
`);

export const RECIPE_INGR_FIELDS = gql(`
    fragment RecipeIngrFields on Recipe {
        _id
        title
        pluralTitle
        calculatedTags
        owner
    }
`);

export const RECIPE_FIELDS_SUBSET = gql(`
    fragment RecipeFieldsSubset on Recipe {
        ...RecipeIngrFields
        titleIdentifier
        tags {
            _id
            value
        }
        isIngredient
        numServings
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
            _id
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
                    ingredients {
                        _id
                        type
                        quantity
                        unit {
                            ...UnitFields
                        }
                        ingredient {
                            ... on Ingredient {
                                ...IngredientFields
                            }
                        }
                        prepMethod {
                            ...PrepMethodFields
                        }
                    }
                    instructions
                    numServings
                }
                ... on Ingredient {
                    ...IngredientFields
                }
            }
            prepMethod {
                ...PrepMethodFields
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
        recipeMany(skip: $offset, limit: $limit, sort: MODIFIED_DESC) {
            ...RecipeFieldsSubset
        }
    }
`);
