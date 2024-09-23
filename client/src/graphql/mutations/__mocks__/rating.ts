import { mockRecipeIdNew, mockRecipeIdOne } from '@recipe/graphql/__mocks__/ids';
import { AddRatingMutation, AddRatingMutationVariables } from '@recipe/graphql/generated';
import { mockRatingNewOne, mockRatingNewTwo } from '@recipe/graphql/queries/__mocks__/rating';

import { ADD_RATING } from '../rating';

export const mockAddRatingNewRecipe = {
    request: {
        query: ADD_RATING,
        variables: {
            recipeId: mockRecipeIdNew,
            rating: mockRatingNewOne.value,
        } satisfies AddRatingMutationVariables,
    },
    result: {
        data: {
            ratingCreateOne: { record: mockRatingNewOne },
        } satisfies AddRatingMutation,
    },
};
export const mockAddRatingRecipeOne = {
    request: {
        query: ADD_RATING,
        variables: {
            recipeId: mockRecipeIdOne,
            rating: mockRatingNewTwo.value,
        } as AddRatingMutationVariables,
    },
    result: {
        data: {
            ratingCreateOne: { record: mockRatingNewTwo },
        } as AddRatingMutation,
    },
};
