import { gql } from '../../__generated__';

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
    query GetRecipeNutrition($recipeId: MongoID!, $ingredientIds: [MongoID!]!) {
        recipeById(_id: $recipeId) {
            _id
            nutrition {
                ...RecipeNutritionFields
            }
        }
        ingredientByIds(_ids: $ingredientIds) {
            _id
            owner {
                _id
            }
        }
    }
`);

export const RECIPE_NUTRITION_FIELDS = gql(`
    fragment RecipeNutritionFields on RecipeNutrition {
        total {
            calories
            protein
            carbs
            fat
        }
        ingredients {
            recipeIngredient
            status
            macros {
                calories
                protein
                carbs
                fat
            }
            reason {
                code
                message
            }
            childUncounted
            childRecipe
        }
    }
`);

export const GET_RECIPE_NUTRITION_PREVIEW = gql(`
    query GetRecipeNutritionPreview(
        $recipeId: MongoID
        $ingredients: [NutritionDraftIngredientInput!]!
    ) {
        recipeNutritionPreview(recipeId: $recipeId, ingredients: $ingredients) {
            ...RecipeNutritionFields
        }
    }
`);

export const GET_NUTRITIONAL_INFOS_BY_INGREDIENT_IDS = gql(`
    query GetNutritionalInfosByIngredientIds($ingredientIds: [MongoID!]!) {
        nutritionalInfosByIngredientIds(ingredientIds: $ingredientIds) {
            _id
            ingredient
            prepMethod {
                _id
                value
            }
            source
            usdaFdcId
            openFoodFactsBarcode
            sourceName
            perGram {
                calories
                protein
                carbs
                fat
            }
        }
    }
`);

export const NUTRITION_PORTION_FIELDS = gql(`
    fragment NutritionPortionFields on UsdaFoodPortion {
        description
        amount
        modifier
        gramWeight
        kind
        millilitres
        impliedDensity
        ambiguous
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
                ...NutritionPortionFields
            }
        }
    }
`);

export const OPEN_FOOD_FACTS_PRODUCT_FIELDS = gql(`
    fragment OpenFoodFactsProductFields on OpenFoodFactsProduct {
        barcode
        name
        brands
        quantity
        caloriesPer100g
        proteinPer100g
        carbsPer100g
        fatPer100g
        warnings
        portions {
            ...NutritionPortionFields
        }
    }
`);

export const OPEN_FOOD_FACTS_SEARCH = gql(`
    query OpenFoodFactsSearch($query: String!, $pageSize: Int, $ukOnly: Boolean) {
        openFoodFactsSearch(query: $query, pageSize: $pageSize, ukOnly: $ukOnly) {
            ...OpenFoodFactsProductFields
        }
    }
`);

export const OPEN_FOOD_FACTS_PRODUCT = gql(`
    query OpenFoodFactsProduct($barcode: String!) {
        openFoodFactsProduct(barcode: $barcode) {
            ...OpenFoodFactsProductFields
        }
    }
`);
