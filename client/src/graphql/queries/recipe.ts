import { gql } from '../../__generated__';

export const GET_INGREDIENT_AND_RECIPE_INGREDIENTS = gql(`
    query GetIngredientAndRecipeIngredients {
        ingredients: ingredientMany(limit: 5000) {
            ...IngredientFields
        }
        recipes: recipeMany(limit: 5000, filter: {isIngredient: true}) {
            ...RecipeIngrFields
        }
    }
`);

export const GET_INGREDIENT_COMPONENTS = gql(`
    query GetIngredientComponents {
        units: unitMany(limit: 5000) {
            ...UnitFields
        }
        sizes: sizeMany(limit: 5000) {
            ...SizeFields
        }
        ingredients: ingredientMany(limit: 5000) {
            ...IngredientFields
        }
        recipes: recipeMany(limit: 5000, filter: {isIngredient: true}) {
            ...RecipeIngrFields
        }
        prepMethods: prepMethodMany(limit: 5000) {
            ...PrepMethodFields
        }
    }
`);

export const RECIPE_INGR_FIELDS = gql(`
    fragment RecipeIngrFields on Recipe {
        _id
        title
        pluralTitle
    }
`);

export const RECIPE_FIELDS_SUBSET = gql(`
    fragment RecipeFieldsSubset on Recipe {
        ...RecipeIngrFields
        titleIdentifier
        tags {
            ...TagFields
        }
        isIngredient
        numServings
        images {
            ...ImageFields
        }
        ratings {
            ...RatingFields
        }
        calculatedTags
        owner
    }
`);

export const RECIPE_FIELDS_FULL = gql(`
    fragment RecipeFieldsFull on Recipe {
        ...RecipeFieldsSubset
        instructionSubsections {
            name
            instructions
        }
        ingredientSubsections {
            name
            ingredients {
                _id
                quantity
                unit {
                    ...UnitFields
                }
                size {
                    ...SizeFields
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
                    ...PrepMethodFields
                }
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
    query GetRecipes($offset: Int = 0, $limit: Int = 1000, $filter: FilterFindManyRecipeInput, $countFilter: FilterCountRecipeInput) {
        recipeMany(skip: $offset, limit: $limit, sort: MODIFIED_DESC, filter: $filter) {
            ...RecipeFieldsSubset
        }
        recipeCount(filter: $countFilter)
    }
`);
