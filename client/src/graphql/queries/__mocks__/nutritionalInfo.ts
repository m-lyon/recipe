import {
    mockAppleId,
    mockCarrotId,
    mockChickenId,
    mockNutritionalInfoIdApple,
    mockNutritionalInfoIdCarrot,
} from '@recipe/graphql/__mocks__/ids';
import {
    GetNutritionalInfoByIngredientQuery,
    GetNutritionalInfoByIngredientQueryVariables,
    GetNutritionalInfosByIngredientIdsQuery,
} from '@recipe/graphql/generated';
import {
    GET_NUTRITIONAL_INFO_BY_INGREDIENT,
    GET_NUTRITIONAL_INFOS_BY_INGREDIENT_IDS,
} from '@recipe/graphql/queries/nutritionalInfo';

/** Returns null nutritional info (ingredient has no linked data) */
const nullResult: GetNutritionalInfoByIngredientQuery = {
    __typename: 'Query',
    nutritionalInfoByIngredient: null,
};

export const mockGetNutritionalInfoByIngredientCarrot = {
    request: {
        query: GET_NUTRITIONAL_INFO_BY_INGREDIENT,
        variables: {
            ingredientId: mockCarrotId,
        } satisfies GetNutritionalInfoByIngredientQueryVariables,
    },
    result: { data: nullResult },
};

export const mockGetNutritionalInfoByIngredientChicken = {
    request: {
        query: GET_NUTRITIONAL_INFO_BY_INGREDIENT,
        variables: {
            ingredientId: mockChickenId,
        } satisfies GetNutritionalInfoByIngredientQueryVariables,
    },
    result: { data: nullResult },
};

// ---------- Batch query mocks for Recipe One ----------
// Recipe One has: apple (×3), carrot (×1) → unique IDs: [apple, carrot].
// The hook deduplicates and sends both IDs in a single batch query.

/** Both apple and carrot have nutritional info with perUnit data */
const recipeBothNutritionResult: GetNutritionalInfosByIngredientIdsQuery = {
    __typename: 'Query',
    nutritionalInfosByIngredientIds: [
        {
            __typename: 'NutritionalInfo',
            _id: mockNutritionalInfoIdApple,
            ingredient: mockAppleId,
            usdaFdcId: 171688,
            perGram: {
                __typename: 'NutritionalInfoPerGram',
                calories: 0.52,
                protein: 0.003,
                carbs: 0.138,
                fat: 0.002,
            },
            perUnit: {
                __typename: 'NutritionalInfoPerGram',
                calories: 95,
                protein: 0.5,
                carbs: 25,
                fat: 0.3,
            },
        },
        {
            __typename: 'NutritionalInfo',
            _id: mockNutritionalInfoIdCarrot,
            ingredient: mockCarrotId,
            usdaFdcId: 170393,
            perGram: {
                __typename: 'NutritionalInfoPerGram',
                calories: 0.41,
                protein: 0.009,
                carbs: 0.096,
                fat: 0.002,
            },
            perUnit: {
                __typename: 'NutritionalInfoPerGram',
                calories: 25,
                protein: 0.6,
                carbs: 5.8,
                fat: 0.1,
            },
        },
    ],
};

/** Mock for recipe view: both ingredients have nutritional data.
 *  NOTE: ingredientIds order must match the Set iteration order produced by
 *  useNutritionalInfo — currently [apple, carrot] based on Recipe One's
 *  ingredient list. If the hook's deduplication strategy changes, update here.
 */
export const mockGetNutritionalInfosForRecipeOne = {
    request: {
        query: GET_NUTRITIONAL_INFOS_BY_INGREDIENT_IDS,
        variables: { ingredientIds: [mockAppleId, mockCarrotId] },
    },
    result: { data: recipeBothNutritionResult },
};

/** Mock for recipe view: empty result (no ingredients have nutritional data) */
export const mockGetNutritionalInfosForRecipeOneEmpty = {
    request: {
        query: GET_NUTRITIONAL_INFOS_BY_INGREDIENT_IDS,
        variables: { ingredientIds: [mockAppleId, mockCarrotId] },
    },
    result: {
        data: {
            __typename: 'Query',
            nutritionalInfosByIngredientIds: [],
        } as GetNutritionalInfosByIngredientIdsQuery,
    },
};
