import { mockLettuceId } from '@recipe/graphql/__mocks__/ids';
import { USDA_SEARCH } from '@recipe/graphql/queries/nutritionalInfo';
import { USDA_FOOD_ITEM } from '@recipe/graphql/queries/nutritionalInfo';
import { mockNutritionalInfoIdApple } from '@recipe/graphql/__mocks__/ids';
import { mockNutritionalInfoIdCarrot } from '@recipe/graphql/__mocks__/ids';
import { GetNutritionalInfoByIngredientQuery } from '@recipe/graphql/generated';
import { GetNutritionalInfosByIngredientIdsQuery } from '@recipe/graphql/generated';
import { UsdaSearchQuery, UsdaSearchQueryVariables } from '@recipe/graphql/generated';
import { mockAppleId, mockCarrotId, mockChickenId } from '@recipe/graphql/__mocks__/ids';
import { GetNutritionalInfoByIngredientQueryVariables } from '@recipe/graphql/generated';
import { UsdaFoodItemQuery, UsdaFoodItemQueryVariables } from '@recipe/graphql/generated';
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

/** Per-100g macros, shared between a food's search and single-item mocks so the
 *  per-gram figures a test asserts on are derived the same way the component derives
 *  them -- no hand-copied floats to drift. */
export const usdaOnionPer100g = { calories: 40, protein: 1.1, carbs: 9.34, fat: 0.1 };

/** 216 g of olive oil in a US customary cup: the raw quotient the USDA portion implies. */
export const OLIVE_OIL_CUP_DENSITY = 216 / 236.588;
/** 160 g of chopped onion in the same cup -- a packing density, hence ambiguous. */
export const ONION_CUP_DENSITY = 160 / 236.588;

/** Applying a suggestion rounds to 4dp, matching the CLI, so these -- not the raw
 *  quotients above -- are what reaches the form field and the ingredient record. */
export const round4 = (n: number): number => Math.round(n * 1e4) / 1e4;
export const OLIVE_OIL_CUP_DENSITY_APPLIED = round4(OLIVE_OIL_CUP_DENSITY);
export const ONION_CUP_DENSITY_APPLIED = round4(ONION_CUP_DENSITY);

/** The per-100g figures behind mockUsdaSearchChickenBreast, exported so the mutation mock
 *  can derive per-gram values by the same arithmetic UsdaLinkSection uses. */
export const usdaChickenBreastPer100g = { calories: 165, protein: 31, carbs: 0, fat: 3.6 };

const usdaSearchChickenBreastResult: UsdaSearchQuery = {
    __typename: 'Query',
    usdaSearch: [
        {
            __typename: 'UsdaFoodItem',
            fdcId: 171077,
            description: 'Chicken breast, cooked',
            brandOwner: null,
            caloriesPer100g: usdaChickenBreastPer100g.calories,
            proteinPer100g: usdaChickenBreastPer100g.protein,
            carbsPer100g: usdaChickenBreastPer100g.carbs,
            fatPer100g: usdaChickenBreastPer100g.fat,
            // The USDA search endpoint returns no portion data, so this is always empty.
            portions: [],
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

const usdaSearchOliveOilResult: UsdaSearchQuery = {
    __typename: 'Query',
    usdaSearch: [
        {
            __typename: 'UsdaFoodItem',
            fdcId: 171413,
            description: 'Oil, olive, salad or cooking',
            brandOwner: null,
            caloriesPer100g: 884,
            proteinPer100g: 0,
            carbsPer100g: 0,
            fatPer100g: 100,
            portions: [],
        },
    ],
};

export const mockUsdaSearchOliveOil = {
    request: {
        query: USDA_SEARCH,
        variables: {
            query: 'olive oil',
            pageSize: 20,
        } satisfies UsdaSearchQueryVariables,
    },
    result: { data: usdaSearchOliveOilResult },
};

// ---------- USDA single-item mocks ----------
// Portions are only available from the single-item endpoint, so selecting a search
// result fires this second query. Provide the matching mock in any test that selects.

/** Two per-item portions, one of them flagged ambiguous. No volume portion, so this
 *  record yields no density suggestion. */
const usdaFoodItemChickenBreastResult: UsdaFoodItemQuery = {
    __typename: 'Query',
    usdaFoodItem: {
        __typename: 'UsdaFoodItem',
        fdcId: 171077,
        description: 'Chicken breast, cooked',
        brandOwner: null,
        caloriesPer100g: 165,
        proteinPer100g: 31,
        carbsPer100g: 0,
        fatPer100g: 3.6,
        portions: [
            {
                __typename: 'UsdaFoodPortion',
                description: '1 breast',
                amount: 1,
                modifier: 'breast',
                gramWeight: 172,
                kind: 'ITEM',
                millilitres: null,
                impliedDensity: null,
                ambiguous: false,
            },
            {
                __typename: 'UsdaFoodPortion',
                description: '1 slice',
                amount: 1,
                modifier: 'slice',
                gramWeight: 21,
                kind: 'ITEM',
                millilitres: null,
                impliedDensity: null,
                ambiguous: true,
            },
            {
                __typename: 'UsdaFoodPortion',
                description: '1 oz',
                amount: 1,
                modifier: 'oz',
                gramWeight: 28.35,
                kind: 'WEIGHT',
                millilitres: null,
                impliedDensity: null,
                ambiguous: false,
            },
        ],
    },
};

export const mockUsdaFoodItemChickenBreast = {
    request: {
        query: USDA_FOOD_ITEM,
        variables: { fdcId: 171077 } satisfies UsdaFoodItemQueryVariables,
    },
    result: { data: usdaFoodItemChickenBreastResult },
};

/** Two portions sharing the same description ("1 serving", buildDescription's fallback
 *  when a portion has no modifier, portionDescription, or usable measureUnit name) but
 *  different gram weights. Exercises picking the second one, not the first, by identity
 *  rather than by description text. */
const usdaSearchChickenDuplicatePortionsResult: UsdaSearchQuery = {
    __typename: 'Query',
    usdaSearch: [
        {
            __typename: 'UsdaFoodItem',
            fdcId: 171998,
            description: 'Chicken, duplicate portion descriptions',
            brandOwner: null,
            caloriesPer100g: 165,
            proteinPer100g: 31,
            carbsPer100g: 0,
            fatPer100g: 3.6,
            portions: [],
        },
    ],
};

export const mockUsdaSearchChickenDuplicatePortions = {
    request: {
        query: USDA_SEARCH,
        variables: {
            query: 'chicken dup',
            pageSize: 20,
        } satisfies UsdaSearchQueryVariables,
    },
    result: { data: usdaSearchChickenDuplicatePortionsResult },
};

const usdaFoodItemChickenDuplicatePortionsResult: UsdaFoodItemQuery = {
    __typename: 'Query',
    usdaFoodItem: {
        __typename: 'UsdaFoodItem',
        fdcId: 171998,
        description: 'Chicken, duplicate portion descriptions',
        brandOwner: null,
        caloriesPer100g: 165,
        proteinPer100g: 31,
        carbsPer100g: 0,
        fatPer100g: 3.6,
        portions: [
            {
                __typename: 'UsdaFoodPortion',
                description: '1 serving',
                amount: null,
                modifier: null,
                gramWeight: 100,
                kind: 'ITEM',
                millilitres: null,
                impliedDensity: null,
                ambiguous: false,
            },
            {
                __typename: 'UsdaFoodPortion',
                description: '1 serving',
                amount: null,
                modifier: null,
                gramWeight: 200,
                kind: 'ITEM',
                millilitres: null,
                impliedDensity: null,
                ambiguous: false,
            },
        ],
    },
};

export const mockUsdaFoodItemChickenDuplicatePortions = {
    request: {
        query: USDA_FOOD_ITEM,
        variables: { fdcId: 171998 } satisfies UsdaFoodItemQueryVariables,
    },
    result: { data: usdaFoodItemChickenDuplicatePortionsResult },
};

/** Volume portions only: yields a density suggestion, and no per-item portion at all. */
const usdaFoodItemOliveOilResult: UsdaFoodItemQuery = {
    __typename: 'Query',
    usdaFoodItem: {
        __typename: 'UsdaFoodItem',
        fdcId: 171413,
        description: 'Oil, olive, salad or cooking',
        brandOwner: null,
        caloriesPer100g: 884,
        proteinPer100g: 0,
        carbsPer100g: 0,
        fatPer100g: 100,
        portions: [
            {
                __typename: 'UsdaFoodPortion',
                description: '1 cup',
                amount: 1,
                modifier: 'cup',
                gramWeight: 216,
                kind: 'VOLUME',
                millilitres: 236.588,
                impliedDensity: OLIVE_OIL_CUP_DENSITY,
                ambiguous: false,
            },
            {
                __typename: 'UsdaFoodPortion',
                description: '1 tablespoon',
                amount: 1,
                modifier: 'tablespoon',
                gramWeight: 13.5,
                kind: 'VOLUME',
                millilitres: 14.78676,
                impliedDensity: 13.5 / 14.78676,
                ambiguous: false,
            },
        ],
    },
};

const usdaSearchBananaResult: UsdaSearchQuery = {
    __typename: 'Query',
    usdaSearch: [
        {
            __typename: 'UsdaFoodItem',
            fdcId: 173944,
            description: 'Bananas, raw',
            brandOwner: null,
            caloriesPer100g: 89,
            proteinPer100g: 1.09,
            carbsPer100g: 22.84,
            fatPer100g: 0.33,
            portions: [],
        },
    ],
};

/** A search USDA answers with no matches at all. */
export const mockUsdaSearchNoMatches = {
    request: {
        query: USDA_SEARCH,
        variables: { query: 'zzzzz', pageSize: 20 } satisfies UsdaSearchQueryVariables,
    },
    result: { data: { __typename: 'Query', usdaSearch: [] } as UsdaSearchQuery },
};

export const mockUsdaSearchBanana = {
    request: {
        query: USDA_SEARCH,
        variables: { query: 'banana', pageSize: 20 } satisfies UsdaSearchQueryVariables,
    },
    result: { data: usdaSearchBananaResult },
};

/** Every portion is ambiguous: the only per-item candidate is an NLEA labelling
 *  serving, and the only volume portion is "cup, mashed" -- a packing density. */
const usdaFoodItemBananaResult: UsdaFoodItemQuery = {
    __typename: 'Query',
    usdaFoodItem: {
        __typename: 'UsdaFoodItem',
        fdcId: 173944,
        description: 'Bananas, raw',
        brandOwner: null,
        caloriesPer100g: 89,
        proteinPer100g: 1.09,
        carbsPer100g: 22.84,
        fatPer100g: 0.33,
        portions: [
            {
                __typename: 'UsdaFoodPortion',
                description: '1 NLEA serving',
                amount: 1,
                modifier: 'NLEA serving',
                gramWeight: 126,
                kind: 'ITEM',
                millilitres: null,
                impliedDensity: null,
                ambiguous: true,
            },
            {
                __typename: 'UsdaFoodPortion',
                description: '1 cup, mashed',
                amount: 1,
                modifier: 'cup, mashed',
                gramWeight: 225,
                kind: 'VOLUME',
                millilitres: 236.588,
                impliedDensity: 225 / 236.588,
                ambiguous: true,
            },
        ],
    },
};

export const mockUsdaFoodItemBanana = {
    request: {
        query: USDA_FOOD_ITEM,
        variables: { fdcId: 173944 } satisfies UsdaFoodItemQueryVariables,
    },
    result: { data: usdaFoodItemBananaResult },
};

const usdaSearchOnionResult: UsdaSearchQuery = {
    __typename: 'Query',
    usdaSearch: [
        {
            __typename: 'UsdaFoodItem',
            fdcId: 170000,
            description: 'Onions, raw',
            brandOwner: null,
            caloriesPer100g: usdaOnionPer100g.calories,
            proteinPer100g: usdaOnionPer100g.protein,
            carbsPer100g: usdaOnionPer100g.carbs,
            fatPer100g: usdaOnionPer100g.fat,
            portions: [],
        },
    ],
};

export const mockUsdaSearchOnion = {
    request: {
        query: USDA_SEARCH,
        variables: { query: 'onion', pageSize: 20 } satisfies UsdaSearchQueryVariables,
    },
    result: { data: usdaSearchOnionResult },
};

/** The only record here carrying both a per-item portion and a volume portion, so it
 *  exercises the derived perUnit and the density suggestion in one flow. */
const usdaFoodItemOnionResult: UsdaFoodItemQuery = {
    __typename: 'Query',
    usdaFoodItem: {
        __typename: 'UsdaFoodItem',
        fdcId: 170000,
        description: 'Onions, raw',
        brandOwner: null,
        caloriesPer100g: usdaOnionPer100g.calories,
        proteinPer100g: usdaOnionPer100g.protein,
        carbsPer100g: usdaOnionPer100g.carbs,
        fatPer100g: usdaOnionPer100g.fat,
        portions: [
            {
                __typename: 'UsdaFoodPortion',
                description: '1 large',
                amount: 1,
                modifier: 'large',
                gramWeight: 150,
                kind: 'ITEM',
                millilitres: null,
                impliedDensity: null,
                ambiguous: false,
            },
            {
                __typename: 'UsdaFoodPortion',
                description: '1 small',
                amount: 1,
                modifier: 'small',
                gramWeight: 70,
                kind: 'ITEM',
                millilitres: null,
                impliedDensity: null,
                ambiguous: false,
            },
            {
                __typename: 'UsdaFoodPortion',
                description: '1 cup, chopped',
                amount: 1,
                modifier: 'cup, chopped',
                gramWeight: 160,
                kind: 'VOLUME',
                millilitres: 236.588,
                impliedDensity: ONION_CUP_DENSITY,
                ambiguous: true,
            },
        ],
    },
};

export const mockUsdaFoodItemOnion = {
    request: {
        query: USDA_FOOD_ITEM,
        variables: { fdcId: 170000 } satisfies UsdaFoodItemQueryVariables,
    },
    result: { data: usdaFoodItemOnionResult },
};

export const mockUsdaFoodItemOliveOil = {
    request: {
        query: USDA_FOOD_ITEM,
        variables: { fdcId: 171413 } satisfies UsdaFoodItemQueryVariables,
    },
    result: { data: usdaFoodItemOliveOilResult },
};
