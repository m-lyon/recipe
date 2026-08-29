import { CreateNutritionalInfoMutation } from '@recipe/graphql/generated';
import { CreateNutritionalInfoMutationVariables } from '@recipe/graphql/generated';
import { CREATE_NUTRITIONAL_INFO } from '@recipe/graphql/mutations/nutritionalInfo';
import { mockBeefId, mockNutritionalInfoIdBeef } from '@recipe/graphql/__mocks__/ids';

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
                perGram: {
                    calories: 1.65,
                    protein: 0.31,
                    carbs: 0,
                    fat: 0.036,
                },
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
                        calories: 1.65,
                        protein: 0.31,
                        carbs: 0,
                        fat: 0.036,
                    },
                    perUnit: null,
                },
            },
        } satisfies CreateNutritionalInfoMutation,
    },
};
