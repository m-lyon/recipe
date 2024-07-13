import { gql } from '../../__generated__';

export const INGREDIENT_FIELDS = gql(`
    fragment IngredientFields on Ingredient {
        _id
        name
        pluralName
        isCountable
    }
`);
export const INGREDIENT_FIELDS_FULL = gql(`
    fragment IngredientFieldsFull on Ingredient {
        ...IngredientFields
        owner
        tags
    }
`);

export const GET_INGREDIENTS = gql(`
    query GetIngredients($filter: FilterFindManyIngredientInput) {
        ingredientMany(limit: 5000, filter: $filter) {
            ...IngredientFieldsFull
        }
        recipeMany(limit: 5000, filter: {isIngredient: true}) {
            ...RecipeIngrFields
        }
    }
`);
