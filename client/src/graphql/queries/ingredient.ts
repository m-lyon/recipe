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
        tags
    }
`);

export const GET_EDITABLE_INGREDIENTS = gql(`
    query GetEditableIngredients {
        ingredientManyEditable(limit: 5000) {
            ...IngredientFieldsFull
        }
    }
`);
