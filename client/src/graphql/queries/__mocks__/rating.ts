import { GET_RATINGS } from '@recipe/graphql/queries/rating';

export const mockGetRatingsRecipeOne = {
    request: {
        query: GET_RATINGS,
        variables: { recipeId: '60f4d2e5c3d5a0a4f1b9c0eb' },
    },
    result: {
        data: {
            ratingMany: [
                {
                    __typename: 'Rating',
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
        variables: { recipeId: '60f4d2e5c3d5a0a4f1b9c0ec' },
    },
    result: {
        data: {
            ratingMany: [
                {
                    __typename: 'Rating',
                    _id: '60f4d2e5c5d5a0a4f1b9c0ec',
                    value: 4.0,
                },
            ],
        },
    },
};
