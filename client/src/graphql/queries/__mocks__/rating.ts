import { GET_RATINGS } from '@recipe/graphql/queries/rating';
import { mockRatingIdNewTwo } from '@recipe/graphql/__mocks__/ids';
import { mockRatingIdNewOne, mockRecipeIdOne } from '@recipe/graphql/__mocks__/ids';
import { mockRecipeIdNew, mockRecipeIdNewAsIngr } from '@recipe/graphql/__mocks__/ids';
import { mockRatingIdOne, mockRatingIdThree, mockRatingIdTwo } from '@recipe/graphql/__mocks__/ids';

import { mockRecipeFour, mockRecipeThree, mockRecipeTwo } from './recipe';

export const mockRatingOne = {
    __typename: 'Rating' as const,
    _id: mockRatingIdOne,
    value: 3.0,
};
export const mockRatingTwo = {
    __typename: 'Rating' as const,
    _id: mockRatingIdTwo,
    value: 4.0,
};
export const mockRatingThree = {
    __typename: 'Rating' as const,
    _id: mockRatingIdThree,
    value: 5.0,
};
export const mockRatingNewOne = {
    __typename: 'Rating' as const,
    _id: mockRatingIdNewOne,
    value: 1.5,
};
export const mockRatingNewTwo = {
    __typename: 'Rating' as const,
    _id: mockRatingIdNewTwo,
    value: 1.5,
};
export const mockGetRatingsRecipeOne = {
    request: {
        query: GET_RATINGS,
        variables: { recipeId: mockRecipeIdOne },
    },
    result: {
        data: {
            ratingMany: [mockRatingOne],
        },
    },
};
export const mockGetRatingsRecipeTwo = {
    request: {
        query: GET_RATINGS,
        variables: { recipeId: mockRecipeTwo._id },
    },
    result: {
        data: {
            ratingMany: [mockRatingTwo],
        },
    },
};
export const mockGetRatingsRecipeThree = {
    request: {
        query: GET_RATINGS,
        variables: { recipeId: mockRecipeThree._id },
    },
    result: {
        data: {
            ratingMany: [mockRatingThree],
        },
    },
};
export const mockGetRatingsRecipeFour = {
    request: {
        query: GET_RATINGS,
        variables: { recipeId: mockRecipeFour._id },
    },
    result: {
        data: {
            ratingMany: [],
        },
    },
};
export const mockGetRatingsNewRecipe = {
    request: {
        query: GET_RATINGS,
        variables: { recipeId: mockRecipeIdNew },
    },
    result: {
        data: {
            ratingMany: [mockRatingNewOne],
        },
    },
};
export const mockGetRatingsNewRecipeAsIngr = {
    request: {
        query: GET_RATINGS,
        variables: { recipeId: mockRecipeIdNewAsIngr },
    },
    result: {
        data: {
            ratingMany: [],
        },
    },
};
