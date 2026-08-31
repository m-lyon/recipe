import { gql } from '../../__generated__';

export const GET_NUTRITIONAL_INFO_BY_INGREDIENT = gql(`
    query GetNutritionalInfoByIngredient($ingredientId: MongoID!) {
        nutritionalInfoByIngredient(filter: { ingredient: $ingredientId }) {
            _id
            ingredient
            usdaFdcId
            perGram { calories protein carbs fat }
            perUnit { calories protein carbs fat }
        }
    }
`);

export const GET_NUTRITIONAL_INFOS_BY_INGREDIENT_IDS = gql(`
    query GetNutritionalInfosByIngredientIds($ingredientIds: [MongoID!]!) {
        nutritionalInfosByIngredientIds(ingredientIds: $ingredientIds) {
            _id
            ingredient
            usdaFdcId
            perGram { calories protein carbs fat }
            perUnit { calories protein carbs fat }
        }
    }
`);

export const USDA_SEARCH = gql(`
    query UsdaSearch($query: String!, $pageSize: Int) {
        usdaSearch(query: $query, pageSize: $pageSize) {
            fdcId
            description
            brandOwner
            caloriesPer100g
            proteinPer100g
            carbsPer100g
            fatPer100g
            portions {
                description
                gramWeight
                kind
            }
        }
    }
`);

/** Portions are only available from the single-item endpoint -- the USDA search
 *  endpoint returns none -- so selecting a search result triggers this second fetch. */
export const USDA_FOOD_ITEM = gql(`
    query UsdaFoodItem($fdcId: Int!) {
        usdaFoodItem(fdcId: $fdcId) {
            fdcId
            description
            brandOwner
            caloriesPer100g
            proteinPer100g
            carbsPer100g
            fatPer100g
            portions {
                description
                amount
                modifier
                gramWeight
                kind
                millilitres
                impliedDensity
                ambiguous
            }
        }
    }
`);
