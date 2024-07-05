import { mockIdNew } from '@recipe/graphql/__mocks__/common';

import { ADD_RATING } from '../rating';

export const mockNewRating = {
    __typename: 'Rating' as const,
    _id: '60f4d2e5c4d5a0a4f1b9c0ec',
    value: 1.5,
};
export const mockAddRating = {
    request: {
        query: ADD_RATING,
        variables: { recipeId: mockIdNew, rating: mockNewRating.value },
    },
    result: {
        data: {
            ratingCreateOne: { record: mockNewRating },
        },
    },
};
