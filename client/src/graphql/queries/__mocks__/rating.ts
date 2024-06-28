import { GET_RATINGS } from '@recipe/graphql/queries/rating';

import { mockRecipeOne, mockRecipeThree, mockRecipeTwo } from './recipe';

export const mockGetRatingsRecipeOne = {
    request: {
        query: GET_RATINGS,
        variables: { recipeId: mockRecipeOne._id },
    },
    result: {
        data: {
            ratingMany: [
                {
                    __typename: 'Rating' as const,
                    _id: '60f4d2e5c4d5a0a4f1b9c0ec',
                    value: 3.0,
                },
            ],
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
            ratingMany: [
                {
                    __typename: 'Rating' as const,
                    _id: '60f4d2e5c5d5a0a4f1b9c0ec',
                    value: 4.0,
                },
            ],
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
            ratingMany: [
                {
                    __typename: 'Rating' as const,
                    _id: '60f4d2e5c6d5a0a4f1b9c0ec',
                    value: 5.0,
                },
            ],
        },
    },
};
