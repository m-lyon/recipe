import { CreateNutritionalInfoMutation } from '@recipe/graphql/generated';
import { CreateNutritionalInfoMutationVariables } from '@recipe/graphql/generated';
import { CREATE_NUTRITIONAL_INFO } from '@recipe/graphql/mutations/nutritionalInfo';
import { usdaOnionPer100g } from '@recipe/graphql/queries/__mocks__/nutritionalInfo';
import { mockBeefId, mockNutritionalInfoIdBeef } from '@recipe/graphql/__mocks__/ids';
import { mockNutritionalInfoIdOnion, mockOnionId } from '@recipe/graphql/__mocks__/ids';
import { usdaChickenBreastPer100g } from '@recipe/graphql/queries/__mocks__/nutritionalInfo';

/** Derived exactly as UsdaLinkSection derives it, so the mock matches bit for bit --
 *  3.6 / 100 is not 0.036 in floating point, so the division must be replayed here. */
const chickenBreastPerGram = {
    calories: usdaChickenBreastPer100g.calories / 100,
    protein: usdaChickenBreastPer100g.protein / 100,
    carbs: usdaChickenBreastPer100g.carbs / 100,
    fat: usdaChickenBreastPer100g.fat / 100,
};

/** Derived exactly as UsdaLinkSection derives it, so the mock matches bit for bit. */
const onionPerGram = {
    calories: usdaOnionPer100g.calories / 100,
    protein: usdaOnionPer100g.protein / 100,
    carbs: usdaOnionPer100g.carbs / 100,
    fat: usdaOnionPer100g.fat / 100,
};
/** perGram x the chosen "1 large" portion of 150 g, rounded to the 2dp the inputs use. */
const onionPerUnit = { calories: 60, protein: 1.65, carbs: 14.01, fat: 0.15 };

/** Fired when USDA nutritional data is staged (via search + "Link selected item") while
 *  creating a brand new "beef" ingredient, then committed once the ingredient is saved --
 *  see UsdaLinkSection's commitPendingLink and CreateIngredientForm. Values derived from
 *  mockUsdaSearchChickenBreast's per-100g figures, divided down to per-gram. */
export const mockCreateNutritionalInfoBeef = {
    request: {
        query: CREATE_NUTRITIONAL_INFO,
        variables: {
            record: {
                ingredient: mockBeefId,
                usdaFdcId: 171077,
                perGram: chickenBreastPerGram,
                // buildRecord always emits perUnit, explicitly null when there is none,
                // so the mock has to carry it or the variables will not match.
                perUnit: null,
            },
        } satisfies CreateNutritionalInfoMutationVariables,
    },
    result: {
        data: {
            __typename: 'Mutation',
            nutritionalInfoCreateOne: {
                __typename: 'CreateOneNutritionalInfoPayload',
                record: {
                    __typename: 'NutritionalInfo',
                    _id: mockNutritionalInfoIdBeef,
                    ingredient: mockBeefId,
                    usdaFdcId: 171077,
                    perGram: {
                        __typename: 'NutritionalInfoPerGram',
                        ...chickenBreastPerGram,
                    },
                    perUnit: null,
                },
            },
        } satisfies CreateNutritionalInfoMutation,
    },
};

/** The staged link committed after a countable "onion" ingredient is created, carrying
 *  the perUnit macros derived from the chosen USDA portion rather than typed by hand. */
export const mockCreateNutritionalInfoOnion = {
    request: {
        query: CREATE_NUTRITIONAL_INFO,
        variables: {
            record: {
                ingredient: mockOnionId,
                usdaFdcId: 170000,
                perGram: onionPerGram,
                perUnit: onionPerUnit,
            },
        } satisfies CreateNutritionalInfoMutationVariables,
    },
    result: {
        data: {
            __typename: 'Mutation',
            nutritionalInfoCreateOne: {
                __typename: 'CreateOneNutritionalInfoPayload',
                record: {
                    __typename: 'NutritionalInfo',
                    _id: mockNutritionalInfoIdOnion,
                    ingredient: mockOnionId,
                    usdaFdcId: 170000,
                    perGram: { __typename: 'NutritionalInfoPerGram', ...onionPerGram },
                    perUnit: { __typename: 'NutritionalInfoPerGram', ...onionPerUnit },
                },
            },
        } satisfies CreateNutritionalInfoMutation,
    },
};
