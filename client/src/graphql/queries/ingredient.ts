import { gql } from '../../__generated__/gql';

export const GET_INGREDIENTS = gql(`
    query GetIngredients {
        ingredientMany(limit: 5000) {
            _id
            name
            pluralName
            isCountable
        }
        recipeMany(limit: 5000, filter: {isIngredient: true}) {
            _id
            title
            pluralTitle
        }
    }
`);