import { mockRecipeIdNew, mockRecipeIdOne } from '@recipe/graphql/__mocks__/ids';
import { mockRatingNewOne, mockRatingNewTwo } from '@recipe/graphql/queries/__mocks__/rating';

import { ADD_RATING } from '../rating';

export const mockAddRatingNewRecipe = {
    request: {
        query: ADD_RATING,
        variables: { recipeId: mockRecipeIdNew, rating: mockRatingNewOne.value },
    },
    result: {
        data: {
            ratingCreateOne: { record: mockRatingNewOne },
        },
    },
};
export const mockAddRatingRecipeOne = {
    request: {
        query: ADD_RATING,
        variables: { recipeId: mockRecipeIdOne, rating: mockRatingNewTwo.value },
    },
    result: {
        data: {
            ratingCreateOne: { record: mockRatingNewTwo },
        },
    },
};
