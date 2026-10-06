import { CreateIngredientMeasureMutation } from '@recipe/graphql/generated';
import { mockOnionCupMeasureId, mockOnionId } from '@recipe/graphql/__mocks__/ids';
import { CreateIngredientMeasureMutationVariables } from '@recipe/graphql/generated';
import { CREATE_INGREDIENT_MEASURE } from '@recipe/graphql/mutations/ingredientMeasure';
import { mockAppleId, mockChoppedId, mockLargeId } from '@recipe/graphql/__mocks__/ids';
import { mockCup, mockEach, mockTeaspoon } from '@recipe/graphql/queries/__mocks__/unit';

type Record = CreateIngredientMeasureMutationVariables['record'];

function createMeasureMock(
    _id: string,
    record: Record,
    unit: typeof mockEach,
    size: { _id: string; value: string } | null,
    prepMethod: { _id: string; value: string } | null
) {
    return {
        request: {
            query: CREATE_INGREDIENT_MEASURE,
            variables: { record } satisfies CreateIngredientMeasureMutationVariables,
        },
        result: {
            data: {
                __typename: 'Mutation',
                ingredientMeasureCreateOne: {
                    __typename: 'CreateOneIngredientMeasurePayload',
                    record: {
                        __typename: 'IngredientMeasure',
                        _id,
                        ingredient: record.ingredient,
                        grams: record.grams,
                        unit,
                        size: size && { __typename: 'Size', ...size },
                        prepMethod: prepMethod && { __typename: 'PrepMethod', ...prepMethod },
                    },
                },
            } satisfies CreateIngredientMeasureMutation,
        },
    };
}

/** "1 large (150 g)" from USDA: each + size large. */
export const mockCreateMeasureOnionLarge = createMeasureMock(
    '60f4d2e5c3d5a0a4f1b9c1c1',
    {
        ingredient: mockOnionId,
        unit: mockEach._id,
        size: mockLargeId,
        prepMethod: null,
        grams: 150,
    },
    mockEach,
    { _id: mockLargeId, value: 'large' },
    null
);

/** "1 cup, chopped (160 g)" from USDA: cup + prep chopped. */
export const mockCreateMeasureOnionCupChopped = createMeasureMock(
    mockOnionCupMeasureId,
    {
        ingredient: mockOnionId,
        unit: mockCup._id,
        size: null,
        prepMethod: mockChoppedId,
        grams: 160,
    },
    mockCup,
    null,
    { _id: mockChoppedId, value: 'chopped' }
);

/** Saved from the uncounted-line prompt: 1 teaspoon of apple weighs 5 g. */
export const mockCreateMeasureAppleTeaspoon = createMeasureMock(
    '60f4d2e5c3d5a0a4f1b9c1c3',
    { ingredient: mockAppleId, unit: mockTeaspoon._id, size: null, prepMethod: null, grams: 5 },
    mockTeaspoon,
    null,
    null
);
