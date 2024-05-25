import { GET_RATINGS } from '@recipe/graphql/queries/rating';

export const mockGetRatings = {
    request: {
        query: GET_RATINGS,
        variables: { recipeId: '60f4d2e5c3d5a0a4f1b9c0eb' },
    },
    result: {
        data: {
            ratingMany: [
                {
                    _id: '60f4d2e5c3d5a0a4f1b9c0ec',
                    value: 3.0,
                },
            ],
        },
    },
};
