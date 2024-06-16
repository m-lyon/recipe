import { gql } from '../../__generated__';

export const GET_INGREDIENTS = gql(`
    query GetIngredients($filter: FilterFindManyIngredientInput) {
        ingredientMany(limit: 5000, filter: $filter) {
            _id
            name
            pluralName
            isCountable
            owner
            tags
        }
        recipeMany(limit: 5000, filter: {isIngredient: true}) {
            _id
            title
            pluralTitle
            owner
            calculatedTags
        }
    }
`);
