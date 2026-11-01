import { CreateNutritionalInfoMutation } from '@recipe/graphql/generated';
import { DeleteNutritionalInfoMutation } from '@recipe/graphql/generated';
import { EnumNutritionalInfoCreateSource } from '@recipe/graphql/generated';
import { mockNutritionalInfoIdCarrot } from '@recipe/graphql/__mocks__/ids';
import { mockNutritionalInfoIdCarrotDiced } from '@recipe/graphql/__mocks__/ids';
import { CreateNutritionalInfoMutationVariables } from '@recipe/graphql/generated';
import { UpdateNutritionalInfoMutationVariables } from '@recipe/graphql/generated';
import { CREATE_NUTRITIONAL_INFO } from '@recipe/graphql/mutations/nutritionalInfo';
import { DELETE_NUTRITIONAL_INFO } from '@recipe/graphql/mutations/nutritionalInfo';
import { UPDATE_NUTRITIONAL_INFO } from '@recipe/graphql/mutations/nutritionalInfo';
import { usdaOnionPer100g } from '@recipe/graphql/queries/__mocks__/nutritionalInfo';
import { mockBeefId, mockNutritionalInfoIdBeef } from '@recipe/graphql/__mocks__/ids';
import { mockNutritionalInfoIdOnion, mockOnionId } from '@recipe/graphql/__mocks__/ids';
import { mockCarrotId, mockChoppedId, mockDicedId } from '@recipe/graphql/__mocks__/ids';
import { offPearlCouscousBarcode } from '@recipe/graphql/queries/__mocks__/nutritionalInfo';
import { offPearlCouscousPer100g } from '@recipe/graphql/queries/__mocks__/nutritionalInfo';
import { usdaChickenBreastPer100g } from '@recipe/graphql/queries/__mocks__/nutritionalInfo';

/** Derived exactly as the form derives it, so the mock matches bit for bit --
 *  3.6 / 100 is not 0.036 in floating point, so the division must be replayed here. */
const chickenBreastPerGram = {
    calories: usdaChickenBreastPer100g.calories / 100,
    protein: usdaChickenBreastPer100g.protein / 100,
    carbs: usdaChickenBreastPer100g.carbs / 100,
    fat: usdaChickenBreastPer100g.fat / 100,
};

/** Derived exactly as the form derives it, so the mock matches bit for bit. */
const onionPerGram = {
    calories: usdaOnionPer100g.calories / 100,
    protein: usdaOnionPer100g.protein / 100,
    carbs: usdaOnionPer100g.carbs / 100,
    fat: usdaOnionPer100g.fat / 100,
};

/** Fired when USDA nutritional data is staged (via search + "Link selected item") while
 *  creating a brand new "beef" ingredient, then committed once the ingredient is saved --
 *  see NutritionRecordEditor's commitChanges and CreateIngredientForm. Values derived from
 *  mockUsdaSearchChickenBreast's per-100g figures, divided down to per-gram. */
export const mockCreateNutritionalInfoBeef = {
    request: {
        query: CREATE_NUTRITIONAL_INFO,
        variables: {
            record: {
                ingredient: mockBeefId,
                source: EnumNutritionalInfoCreateSource.Usda,
                usdaFdcId: 171077,
                openFoodFactsBarcode: null,
                sourceName: 'Chicken breast, cooked',
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
                source: EnumNutritionalInfoCreateSource.Usda,
                usdaFdcId: 170000,
                openFoodFactsBarcode: null,
                sourceName: 'Onions, raw',
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

/** Removes carrot's hand-entered nutritional data, once the ingredient is saved. */
export const mockDeleteNutritionalInfoCarrot = {
    request: {
        query: DELETE_NUTRITIONAL_INFO,
        variables: { _id: mockNutritionalInfoIdCarrot },
    },
    result: {
        data: {
            __typename: 'Mutation',
            nutritionalInfoRemoveById: {
                __typename: 'RemoveByIdNutritionalInfoPayload',
                recordId: mockNutritionalInfoIdCarrot,
            },
        } satisfies DeleteNutritionalInfoMutation,
    },
};

type RecordInput = CreateNutritionalInfoMutationVariables['record'];

/** Derived exactly as the form derives it: per-100 g values divided by 100. */
function perGramOf(per100g: { calories: number; protein: number; carbs: number; fat: number }) {
    return {
        calories: per100g.calories / 100,
        protein: per100g.protein / 100,
        carbs: per100g.carbs / 100,
        fat: per100g.fat / 100,
    };
}

function created(_id: string, record: RecordInput) {
    return {
        request: { query: CREATE_NUTRITIONAL_INFO, variables: { record } },
        result: {
            data: {
                __typename: 'Mutation',
                nutritionalInfoCreateOne: {
                    __typename: 'CreateOneNutritionalInfoPayload',
                    record: {
                        __typename: 'NutritionalInfo',
                        _id,
                        ingredient: record.ingredient,
                        usdaFdcId: record.usdaFdcId ?? null,
                        perGram: { __typename: 'NutritionalInfoPerGram', ...record.perGram },
                    },
                },
            } satisfies CreateNutritionalInfoMutation,
        },
    };
}

/** Values typed by hand for carrot, per 100 g, from a pack label. */
export const carrotLabelPer100 = { calories: 41, protein: 0.9, carbs: 9.6, fat: 0.2 };

/** Carrot linked to a USDA item. */
export const mockCreateNutritionalInfoCarrotUsda = created(mockNutritionalInfoIdCarrot, {
    ingredient: mockCarrotId,
    source: EnumNutritionalInfoCreateSource.Usda,
    usdaFdcId: 171077,
    openFoodFactsBarcode: null,
    sourceName: 'Chicken breast, cooked',
    perGram: chickenBreastPerGram,
});

/** Carrot linked to an Open Food Facts product. */
export const mockCreateNutritionalInfoCarrotOpenFoodFacts = created(mockNutritionalInfoIdCarrot, {
    ingredient: mockCarrotId,
    source: EnumNutritionalInfoCreateSource.OpenFoodFacts,
    usdaFdcId: null,
    openFoodFactsBarcode: offPearlCouscousBarcode,
    sourceName: "Al'fez · Pearl Couscous",
    perGram: perGramOf(offPearlCouscousPer100g),
});

/** Carrot values entered by hand, per 100 g. */
export const mockCreateNutritionalInfoCarrotManual = created(mockNutritionalInfoIdCarrot, {
    ingredient: mockCarrotId,
    source: EnumNutritionalInfoCreateSource.Manual,
    usdaFdcId: null,
    openFoodFactsBarcode: null,
    sourceName: 'Tesco pack label',
    perGram: perGramOf(carrotLabelPer100),
});

/** 1 cup of carrot weighs 240 g, so a millilitre weighs 240 / 236.5882365 g. */
export const carrotCupGrams = 240;
const carrotGramsPerMillilitre = carrotCupGrams / 236.5882365;

/** Carrot values entered by hand, per 100 ml, and converted with the cup measure. */
export const mockCreateNutritionalInfoCarrotManualPer100ml = created(mockNutritionalInfoIdCarrot, {
    ingredient: mockCarrotId,
    source: EnumNutritionalInfoCreateSource.Manual,
    usdaFdcId: null,
    openFoodFactsBarcode: null,
    sourceName: null,
    perGram: Object.fromEntries(
        Object.entries(perGramOf(carrotLabelPer100)).map(([key, value]) => [
            key,
            value * (1 / carrotGramsPerMillilitre),
        ])
    ) as RecordInput['perGram'],
});

/** Values entered by hand for chopped carrot, a record of its own. */
export const mockCreateNutritionalInfoCarrotChopped = created(mockNutritionalInfoIdCarrotDiced, {
    ingredient: mockCarrotId,
    prepMethod: mockChoppedId,
    source: EnumNutritionalInfoCreateSource.Manual,
    usdaFdcId: null,
    openFoodFactsBarcode: null,
    sourceName: null,
    perGram: perGramOf(carrotLabelPer100),
});

/** Diced carrot's record, changed to values entered by hand. */
export const mockUpdateNutritionalInfoCarrotDiced = {
    request: {
        query: UPDATE_NUTRITIONAL_INFO,
        variables: {
            _id: mockNutritionalInfoIdCarrotDiced,
            record: {
                ingredient: mockCarrotId,
                prepMethod: mockDicedId,
                source: EnumNutritionalInfoCreateSource.Manual,
                usdaFdcId: null,
                openFoodFactsBarcode: null,
                sourceName: null,
                perGram: perGramOf(carrotLabelPer100),
            },
        } satisfies UpdateNutritionalInfoMutationVariables,
    },
    result: {
        data: {
            __typename: 'Mutation' as const,
            nutritionalInfoUpdateById: {
                __typename: 'UpdateByIdNutritionalInfoPayload' as const,
                record: {
                    __typename: 'NutritionalInfo' as const,
                    _id: mockNutritionalInfoIdCarrotDiced,
                    ingredient: mockCarrotId,
                    usdaFdcId: null,
                    perGram: {
                        __typename: 'NutritionalInfoPerGram' as const,
                        ...perGramOf(carrotLabelPer100),
                    },
                },
            },
        },
    },
};

/** Removes diced carrot's record only. */
export const mockDeleteNutritionalInfoCarrotDiced = {
    request: {
        query: DELETE_NUTRITIONAL_INFO,
        variables: { _id: mockNutritionalInfoIdCarrotDiced },
    },
    result: {
        data: {
            __typename: 'Mutation',
            nutritionalInfoRemoveById: {
                __typename: 'RemoveByIdNutritionalInfoPayload',
                recordId: mockNutritionalInfoIdCarrotDiced,
            },
        } satisfies DeleteNutritionalInfoMutation,
    },
};
