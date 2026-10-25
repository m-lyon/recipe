import { Macros } from '@recipe/graphql/schema';
import { mockLettuceId } from '@recipe/graphql/__mocks__/ids';
import { USDA_SEARCH } from '@recipe/graphql/queries/nutritionalInfo';
import { mockCarrotEachMeasureId } from '@recipe/graphql/__mocks__/ids';
import { USDA_FOOD_ITEM } from '@recipe/graphql/queries/nutritionalInfo';
import { mockRecipeIngredientIdTwo } from '@recipe/graphql/__mocks__/ids';
import { mockRecipeIngredientIdFour } from '@recipe/graphql/__mocks__/ids';
import { mockRecipeIngredientIdFive } from '@recipe/graphql/__mocks__/ids';
import { mockNutritionalInfoIdCarrot } from '@recipe/graphql/__mocks__/ids';
import { IngredientMeasureFieldsFragment } from '@recipe/graphql/generated';
import { mockRecipeIngredientIdThree } from '@recipe/graphql/__mocks__/ids';
import { GET_RECIPE_NUTRITION } from '@recipe/graphql/queries/nutritionalInfo';
import { GET_INGREDIENT_MEASURES } from '@recipe/graphql/queries/nutritionalInfo';
import { GetNutritionalInfosByIngredientIdsQuery } from '@recipe/graphql/generated';
import { mockAdminId, mockAppleEachMeasureId } from '@recipe/graphql/__mocks__/ids';
import { UsdaSearchQuery, UsdaSearchQueryVariables } from '@recipe/graphql/generated';
import { mockAppleId, mockCarrotId, mockChickenId } from '@recipe/graphql/__mocks__/ids';
import { UsdaFoodItemQuery, UsdaFoodItemQueryVariables } from '@recipe/graphql/generated';
import { mockRecipeIdOne, mockRecipeIngredientIdOne } from '@recipe/graphql/__mocks__/ids';
import { GetRecipeNutritionQueryVariables, UncountedCode } from '@recipe/graphql/generated';
import { mockDicedId, mockNutritionalInfoIdCarrotDiced } from '@recipe/graphql/__mocks__/ids';
import { GetIngredientMeasuresQuery, GetRecipeNutritionQuery } from '@recipe/graphql/generated';
import { GET_NUTRITIONAL_INFOS_BY_INGREDIENT_IDS } from '@recipe/graphql/queries/nutritionalInfo';

import { mockCup, mockEach, mockOunce, mockTeaspoon } from './unit';

// ---------- Recipe nutrition mocks for Recipe One ----------
// Recipe One has: apple (×4), carrot (×1) → unique IDs: [apple, carrot].
// The hook deduplicates and sends both IDs in a single query.

const applePerGram = {
    __typename: 'NutritionalInfoPerGram' as const,
    calories: 0.52,
    protein: 0.003,
    carbs: 0.138,
    fat: 0.002,
};
const carrotPerGram = {
    __typename: 'NutritionalInfoPerGram' as const,
    calories: 0.41,
    protein: 0.009,
    carbs: 0.096,
    fat: 0.002,
};

/** 1 apple weighs 182 g. */
export const mockAppleEachMeasure: IngredientMeasureFieldsFragment = {
    __typename: 'IngredientMeasure',
    _id: mockAppleEachMeasureId,
    ingredient: mockAppleId,
    grams: 182,
    unit: mockEach,
    size: null,
    prepMethod: null,
};
/** 1 carrot weighs 61 g. */
export const mockCarrotEachMeasure: IngredientMeasureFieldsFragment = {
    __typename: 'IngredientMeasure',
    _id: mockCarrotEachMeasureId,
    ingredient: mockCarrotId,
    grams: 61,
    unit: mockEach,
    size: null,
    prepMethod: null,
};

const ZERO: Macros = { __typename: 'Macros', calories: 0, protein: 0, carbs: 0, fat: 0 };

function macrosOf(perGram: typeof applePerGram, grams: number): Macros {
    return {
        __typename: 'Macros',
        calories: perGram.calories * grams,
        protein: perGram.protein * grams,
        carbs: perGram.carbs * grams,
        fat: perGram.fat * grams,
    };
}

function sum(results: Array<{ macros: Macros }>): Macros {
    return results.reduce(
        (total, result) => ({
            __typename: 'Macros',
            calories: total.calories + result.macros.calories,
            protein: total.protein + result.macros.protein,
            carbs: total.carbs + result.macros.carbs,
            fat: total.fat + result.macros.fat,
        }),
        ZERO
    );
}

function counted(recipeIngredient: string, macros: Macros) {
    return {
        __typename: 'IngredientNutrition' as const,
        recipeIngredient,
        status: 'COUNTED' as const,
        macros,
        reason: null,
        childUncounted: null,
        childRecipe: null,
    };
}

function uncounted(recipeIngredient: string, code: UncountedCode, message: string) {
    return {
        __typename: 'IngredientNutrition' as const,
        recipeIngredient,
        status: 'UNCOUNTED' as const,
        macros: ZERO,
        reason: { __typename: 'UncountedReason' as const, code, message },
        childUncounted: null,
        childRecipe: null,
    };
}

const recipeOneOwners: GetRecipeNutritionQuery['ingredientByIds'] = [
    {
        __typename: 'Ingredient',
        _id: mockAppleId,
        owner: { __typename: 'Owner', _id: mockAdminId },
    },
    {
        __typename: 'Ingredient',
        _id: mockCarrotId,
        owner: { __typename: 'Owner', _id: mockAdminId },
    },
];

function recipeOneNutrition(ingredients: ReturnType<typeof counted | typeof uncounted>[]) {
    return {
        __typename: 'Query',
        recipeById: {
            __typename: 'Recipe',
            _id: mockRecipeIdOne,
            nutrition: { __typename: 'RecipeNutrition', total: sum(ingredients), ingredients },
        },
        ingredientByIds: recipeOneOwners,
    } satisfies GetRecipeNutritionQuery;
}

const recipeOneVariables: GetRecipeNutritionQueryVariables = {
    recipeId: mockRecipeIdOne,
    ingredientIds: [mockAppleId, mockCarrotId],
};

const carrotNutrition = counted(mockRecipeIngredientIdTwo, macrosOf(carrotPerGram, 61));
const twoApplesNutrition = counted(mockRecipeIngredientIdThree, macrosOf(applePerGram, 2 * 182));
const ounceAppleNutrition = counted(
    mockRecipeIngredientIdFive,
    macrosOf(applePerGram, mockOunce.perCanonical)
);

/** Apple and carrot have per-gram macros and an item weight, but no volume weight. */
export const mockGetRecipeNutritionForRecipeOne = {
    request: { query: GET_RECIPE_NUTRITION, variables: recipeOneVariables },
    result: {
        data: recipeOneNutrition([
            uncounted(
                mockRecipeIngredientIdOne,
                'NO_MEASURE',
                'No weight recorded for 1 teaspoon of apple'
            ),
            carrotNutrition,
            twoApplesNutrition,
            uncounted(
                mockRecipeIngredientIdFour,
                'NO_MEASURE',
                'No weight recorded for 1 cup of medium apple'
            ),
            ounceAppleNutrition,
        ]),
    },
};

/** After the uncounted-ingredient prompt saves "1 teaspoon of apple = 5 g": a volume row is a
 *  density, so it prices the cup of apple too. */
export const mockGetRecipeNutritionForRecipeOneWithTeaspoon = {
    request: { query: GET_RECIPE_NUTRITION, variables: recipeOneVariables },
    result: {
        data: recipeOneNutrition([
            counted(mockRecipeIngredientIdOne, macrosOf(applePerGram, 5)),
            carrotNutrition,
            twoApplesNutrition,
            counted(
                mockRecipeIngredientIdFour,
                macrosOf(
                    applePerGram,
                    (((1 / 3) * mockCup.perCanonical) / mockTeaspoon.perCanonical) * 5
                )
            ),
            ounceAppleNutrition,
        ]),
    },
};

/** No ingredient in Recipe One has nutritional data. */
export const mockGetRecipeNutritionForRecipeOneEmpty = {
    request: { query: GET_RECIPE_NUTRITION, variables: recipeOneVariables },
    result: {
        data: recipeOneNutrition(
            [
                [mockRecipeIngredientIdOne, 'apple'],
                [mockRecipeIngredientIdTwo, 'carrot'],
                [mockRecipeIngredientIdThree, 'apple'],
                [mockRecipeIngredientIdFour, 'apple'],
                [mockRecipeIngredientIdFive, 'apple'],
            ].map(([id, name]) => uncounted(id, 'NO_NUTRITION', `No nutritional data for ${name}`))
        ),
    },
};

/** Fallback for any page that shows recipe nutrition: nothing counted. renderPage appends
 *  this after the test's own mocks, so a specific mock still wins. */
export const mockGetRecipeNutritionFallback = {
    request: { query: GET_RECIPE_NUTRITION },
    variableMatcher: () => true,
    maxUsageCount: Number.POSITIVE_INFINITY,
    result: (variables: GetRecipeNutritionQueryVariables) => ({
        data: {
            __typename: 'Query',
            recipeById: {
                __typename: 'Recipe',
                _id: variables.recipeId,
                nutrition: { __typename: 'RecipeNutrition', total: ZERO, ingredients: [] },
            },
            ingredientByIds: [],
        } satisfies GetRecipeNutritionQuery,
    }),
};

/** Fallback for the ingredient form's measures list: no measures recorded. */
export const mockGetIngredientMeasuresFallback = {
    request: { query: GET_INGREDIENT_MEASURES },
    variableMatcher: () => true,
    maxUsageCount: Number.POSITIVE_INFINITY,
    result: {
        data: {
            __typename: 'Query',
            ingredientMeasuresByIngredientIds: [],
        } satisfies GetIngredientMeasuresQuery,
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

/** Carrot has nutritional data entered by hand: per-gram values, no USDA item. */
export const mockGetNutritionalInfosForEditIngredientCarrotLinked = {
    request: mockGetNutritionalInfosForEditIngredient.request,
    result: {
        data: {
            __typename: 'Query',
            nutritionalInfosByIngredientIds: [
                {
                    __typename: 'NutritionalInfo',
                    _id: mockNutritionalInfoIdCarrot,
                    ingredient: mockCarrotId,
                    prepMethod: null,
                    usdaFdcId: null,
                    perGram: {
                        __typename: 'NutritionalInfoPerGram',
                        calories: 0.41,
                        protein: 0.009,
                        carbs: 0.096,
                        fat: 0.002,
                    },
                },
            ],
        } satisfies GetNutritionalInfosByIngredientIdsQuery,
    },
};

/** Carrot has nutritional data for diced carrot only, which the form does not edit. */
export const mockGetNutritionalInfosForEditIngredientCarrotDicedOnly = {
    request: mockGetNutritionalInfosForEditIngredient.request,
    result: {
        data: {
            __typename: 'Query',
            nutritionalInfosByIngredientIds: [
                {
                    __typename: 'NutritionalInfo',
                    _id: mockNutritionalInfoIdCarrotDiced,
                    ingredient: mockCarrotId,
                    prepMethod: { __typename: 'PrepMethod', _id: mockDicedId },
                    usdaFdcId: null,
                    perGram: {
                        __typename: 'NutritionalInfoPerGram',
                        calories: 0.35,
                        protein: 0.008,
                        carbs: 0.082,
                        fat: 0.002,
                    },
                },
            ],
        } satisfies GetNutritionalInfosByIngredientIdsQuery,
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
                impliedDensity: 216 / 236.588,
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
                impliedDensity: 160 / 236.588,
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
