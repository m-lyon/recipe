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
                },
            },
        } satisfies CreateNutritionalInfoMutation,
    },
};

/** The staged link committed after a countable "onion" ingredient is created. */
export const mockCreateNutritionalInfoOnion = {
    request: {
        query: CREATE_NUTRITIONAL_INFO,
        variables: {
            record: {
                ingredient: mockOnionId,
                usdaFdcId: 170000,
                perGram: onionPerGram,
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
                },
            },
        } satisfies CreateNutritionalInfoMutation,
    },
};
