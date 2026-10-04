import { gql } from './__generated__/gql.js';

export const LOGIN = gql(`
    mutation CliLogin($username: String!, $password: String!) {
        login(username: $username, password: $password) {
            _id
            username
            role
        }
    }
`);

export const LOGOUT = gql(`
    mutation CliLogout {
        logout
    }
`);

export const CURRENT_USER = gql(`
    query CliCurrentUser {
        currentUser {
            _id
            username
            role
            firstName
            lastName
        }
    }
`);

export const INGREDIENT_FIELDS = gql(`
    fragment CliIngredientFields on Ingredient {
        _id
        name
        pluralName
        isCountable
        tags
    }
`);

export const UNIT_FIELDS = gql(`
    fragment CliUnitFields on Unit {
        _id
        shortSingular
        shortPlural
        longSingular
        longPlural
        dimension
        perCanonical
        system
        hidden
    }
`);

export const INGREDIENT_MEASURE_FIELDS = gql(`
    fragment CliIngredientMeasureFields on IngredientMeasure {
        _id
        ingredient
        grams
        unit {
            ...CliUnitFields
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

export const NUTRITIONAL_INFO_FIELDS = gql(`
    fragment CliNutritionalInfoFields on NutritionalInfo {
        _id
        ingredient
        usdaFdcId
        perGram {
            calories
            protein
            carbs
            fat
        }
    }
`);

export const GET_ALL_INGREDIENTS = gql(`
    query CliGetAllIngredients {
        ingredientManyAll(limit: 5000) {
            ...CliIngredientFields
        }
    }
`);

export const GET_NUTRITIONAL_INFOS = gql(`
    query CliGetNutritionalInfos($ingredientIds: [MongoID!]!) {
        nutritionalInfosByIngredientIds(ingredientIds: $ingredientIds) {
            ...CliNutritionalInfoFields
        }
    }
`);

export const GET_NUTRITIONAL_INFO = gql(`
    query CliGetNutritionalInfo($ingredientId: MongoID!) {
        nutritionalInfoByIngredient(filter: { ingredient: $ingredientId }) {
            ...CliNutritionalInfoFields
        }
    }
`);

export const RECIPE_SUMMARY_FIELDS = gql(`
    fragment CliRecipeSummaryFields on Recipe {
        _id
        title
        titleIdentifier
        isIngredient
        archived
    }
`);

export const RECIPE_INGREDIENT_FIELDS = gql(`
    fragment CliRecipeIngredientFields on Recipe {
        ...CliRecipeSummaryFields
        ingredientSubsections {
            name
            ingredients {
                _id
                quantity
                unit {
                    ...CliUnitFields
                }
                size {
                    _id
                    value
                }
                prepMethod {
                    _id
                    value
                }
                ingredient {
                    __typename
                    ... on Ingredient {
                        ...CliIngredientFields
                    }
                    ... on Recipe {
                        _id
                        title
                    }
                }
            }
        }
    }
`);

export const GET_ALL_RECIPES = gql(`
    query CliGetAllRecipes {
        recipeMany(limit: 5000) {
            ...CliRecipeSummaryFields
        }
    }
`);

export const GET_RECIPES_BY_IDS = gql(`
    query CliGetRecipesByIds($ids: [MongoID!]!) {
        recipeByIds(_ids: $ids, limit: 5000) {
            ...CliRecipeIngredientFields
        }
    }
`);

export const GET_RECIPE_BY_IDENTIFIER = gql(`
    query CliGetRecipeByIdentifier($titleIdentifier: String!) {
        recipeOne(filter: { titleIdentifier: $titleIdentifier }) {
            ...CliRecipeIngredientFields
        }
    }
`);

export const GET_RECIPE_BY_ID = gql(`
    query CliGetRecipeById($id: MongoID!) {
        recipeById(_id: $id) {
            ...CliRecipeIngredientFields
        }
    }
`);

export const USDA_FOOD_ITEM_FIELDS = gql(`
    fragment CliUsdaFoodItemFields on UsdaFoodItem {
        fdcId
        description
        dataType
        brandOwner
        caloriesPer100g
        proteinPer100g
        carbsPer100g
        fatPer100g
    }
`);

export const USDA_SEARCH = gql(`
    query CliUsdaSearch($query: String!, $pageSize: Int) {
        usdaSearch(query: $query, pageSize: $pageSize) {
            ...CliUsdaFoodItemFields
        }
    }
`);

export const USDA_FOOD_ITEM = gql(`
    query CliUsdaFoodItem($fdcId: Int!) {
        usdaFoodItem(fdcId: $fdcId) {
            ...CliUsdaFoodItemFields
            servingSize
            servingSizeUnit
            householdServingFullText
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

export const CREATE_NUTRITIONAL_INFO = gql(`
    mutation CliCreateNutritionalInfo($record: CreateOneNutritionalInfoCreateInput!) {
        nutritionalInfoCreateOne(record: $record) {
            record {
                ...CliNutritionalInfoFields
            }
        }
    }
`);

export const UPDATE_NUTRITIONAL_INFO = gql(`
    mutation CliUpdateNutritionalInfo($id: MongoID!, $record: UpdateByIdNutritionalInfoInput!) {
        nutritionalInfoUpdateById(_id: $id, record: $record) {
            record {
                ...CliNutritionalInfoFields
            }
        }
    }
`);

export const DELETE_NUTRITIONAL_INFO = gql(`
    mutation CliDeleteNutritionalInfo($id: MongoID!) {
        nutritionalInfoRemoveById(_id: $id) {
            recordId
        }
    }
`);

export const GET_INGREDIENT_MEASURES = gql(`
    query CliGetIngredientMeasures($ingredientIds: [MongoID!]!) {
        ingredientMeasuresByIngredientIds(ingredientIds: $ingredientIds) {
            ...CliIngredientMeasureFields
        }
    }
`);

export const GET_MEASURE_COMPONENTS = gql(`
    query CliGetMeasureComponents {
        units: unitMany(limit: 5000) {
            ...CliUnitFields
        }
        sizes: sizeMany(limit: 5000) {
            _id
            value
        }
        prepMethods: prepMethodMany(limit: 5000) {
            _id
            value
        }
    }
`);

export const CREATE_INGREDIENT_MEASURE = gql(`
    mutation CliCreateIngredientMeasure($record: CreateOneIngredientMeasureInput!) {
        ingredientMeasureCreateOne(record: $record) {
            record {
                ...CliIngredientMeasureFields
            }
        }
    }
`);

export const DELETE_INGREDIENT_MEASURE = gql(`
    mutation CliDeleteIngredientMeasure($id: MongoID!) {
        ingredientMeasureRemoveById(_id: $id) {
            recordId
        }
    }
`);
