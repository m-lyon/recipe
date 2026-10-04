import { gql } from '../../__generated__';

export const GET_NUTRITIONAL_INFO_BY_INGREDIENT = gql(`
    query GetNutritionalInfoByIngredient($ingredientId: MongoID!) {
        nutritionalInfoByIngredient(filter: { ingredient: $ingredientId }) {
            _id
            ingredient
            usdaFdcId
            perGram { calories protein carbs fat }
        }
    }
`);

export const INGREDIENT_MEASURE_FIELDS = gql(`
    fragment IngredientMeasureFields on IngredientMeasure {
        _id
        ingredient
        grams
        unit {
            ...UnitFields
        }
        size {
            _id
            value
        }
        prepMethod {
            _id
            value
        }
    }
`);

export const GET_INGREDIENT_MEASURES = gql(`
    query GetIngredientMeasures($ingredientIds: [MongoID!]!) {
        ingredientMeasuresByIngredientIds(ingredientIds: $ingredientIds) {
            ...IngredientMeasureFields
        }
    }
`);

export const GET_RECIPE_NUTRITION = gql(`
    query GetRecipeNutrition($ingredientIds: [MongoID!]!) {
        nutritionalInfosByIngredientIds(ingredientIds: $ingredientIds) {
            _id
            ingredient
            perGram { calories protein carbs fat }
        }
        ingredientMeasuresByIngredientIds(ingredientIds: $ingredientIds) {
            ...IngredientMeasureFields
        }
        ingredientByIds(_ids: $ingredientIds) {
            _id
            owner
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
