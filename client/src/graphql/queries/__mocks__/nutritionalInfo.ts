import { mockCarrotId, mockChickenId } from '@recipe/graphql/__mocks__/ids';
import { GetNutritionalInfoByIngredientQuery } from '@recipe/graphql/generated';
import { GetNutritionalInfoByIngredientQueryVariables } from '@recipe/graphql/generated';
import { GET_NUTRITIONAL_INFO_BY_INGREDIENT } from '@recipe/graphql/queries/nutritionalInfo';

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
