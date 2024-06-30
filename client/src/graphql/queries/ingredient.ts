import { gql } from '../../__generated__';

export const INGREDIENT_FIELDS = gql(`
    fragment IngredientFields on Ingredient {
        _id
        name
        pluralName
        isCountable
    }
`);

export const GET_INGREDIENTS = gql(`
    query GetIngredients($filter: FilterFindManyIngredientInput) {
        ingredientMany(limit: 5000, filter: $filter) {
            ...IngredientFields
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
