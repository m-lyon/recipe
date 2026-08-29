import { mockLettuceId } from '@recipe/graphql/__mocks__/ids';
import { USDA_SEARCH } from '@recipe/graphql/queries/nutritionalInfo';
import { mockNutritionalInfoIdApple } from '@recipe/graphql/__mocks__/ids';
import { mockNutritionalInfoIdCarrot } from '@recipe/graphql/__mocks__/ids';
import { GetNutritionalInfoByIngredientQuery } from '@recipe/graphql/generated';
import { GetNutritionalInfosByIngredientIdsQuery } from '@recipe/graphql/generated';
import { UsdaSearchQuery, UsdaSearchQueryVariables } from '@recipe/graphql/generated';
import { mockAppleId, mockCarrotId, mockChickenId } from '@recipe/graphql/__mocks__/ids';
import { GetNutritionalInfoByIngredientQueryVariables } from '@recipe/graphql/generated';
import { GET_NUTRITIONAL_INFO_BY_INGREDIENT } from '@recipe/graphql/queries/nutritionalInfo';
import { GET_NUTRITIONAL_INFOS_BY_INGREDIENT_IDS } from '@recipe/graphql/queries/nutritionalInfo';

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

// ---------- Batch query mock for the EditIngredient page ----------
// EditIngredient prefetches nutritional info for every ingredient in the list (in
// ingredientMany order: apple, chicken, carrot, lettuce) alongside the ingredient list
// itself, so UsdaLinkSection doesn't need a per-ingredient loading query.

export const mockGetNutritionalInfosForEditIngredient = {
    request: {
        query: GET_NUTRITIONAL_INFOS_BY_INGREDIENT_IDS,
        variables: {
            ingredientIds: [mockAppleId, mockChickenId, mockCarrotId, mockLettuceId],
        },
    },
    result: {
        data: {
            __typename: 'Query',
            nutritionalInfosByIngredientIds: [],
        } as GetNutritionalInfosByIngredientIdsQuery,
    },
};

/** After carrot is deleted, the ingredient list (and so the batch query's variables) shrinks. */
export const mockGetNutritionalInfosForEditIngredientAfterCarrotDeleted = {
    request: {
        query: GET_NUTRITIONAL_INFOS_BY_INGREDIENT_IDS,
        variables: {
            ingredientIds: [mockAppleId, mockChickenId, mockLettuceId],
        },
    },
    result: {
        data: {
            __typename: 'Query',
            nutritionalInfosByIngredientIds: [],
        } as GetNutritionalInfosByIngredientIdsQuery,
    },
};

// ---------- USDA search mocks ----------

const usdaSearchChickenBreastResult: UsdaSearchQuery = {
    __typename: 'Query',
    usdaSearch: [
        {
            __typename: 'UsdaFoodItem',
            fdcId: 171077,
            description: 'Chicken breast, cooked',
            brandOwner: null,
            caloriesPer100g: 165,
            proteinPer100g: 31,
            carbsPer100g: 0,
            fatPer100g: 3.6,
        },
    ],
};

export const mockUsdaSearchChickenBreast = {
    request: {
        query: USDA_SEARCH,
        variables: {
            query: 'chicken breast',
            pageSize: 20,
        } satisfies UsdaSearchQueryVariables,
    },
    result: { data: usdaSearchChickenBreastResult },
};
