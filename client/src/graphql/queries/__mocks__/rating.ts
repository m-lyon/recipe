import { GET_RATINGS } from '@recipe/graphql/queries/rating';
import { mockRecipeIdThree, mockRecipeIdTwo } from '@recipe/graphql/__mocks__/ids';
import { mockRatingIdNewOne, mockRecipeIdOne } from '@recipe/graphql/__mocks__/ids';
import { mockRatingIdNewTwo, mockRecipeIdFour } from '@recipe/graphql/__mocks__/ids';
import { GetRatingsQuery, GetRatingsQueryVariables } from '@recipe/graphql/generated';
import { mockRecipeIdNew, mockRecipeIdNewAsIngr } from '@recipe/graphql/__mocks__/ids';
import { mockRatingIdOne, mockRatingIdThree, mockRatingIdTwo } from '@recipe/graphql/__mocks__/ids';

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
        variables: { recipeId: mockRecipeIdOne } satisfies GetRatingsQueryVariables,
    },
    result: {
        data: {
            ratingMany: [mockRatingOne],
        } satisfies GetRatingsQuery,
    },
};
export const mockGetRatingsRecipeTwo = {
    request: {
        query: GET_RATINGS,
        variables: { recipeId: mockRecipeIdTwo } satisfies GetRatingsQueryVariables,
    },
    result: {
        data: {
            ratingMany: [mockRatingTwo],
        } satisfies GetRatingsQuery,
    },
};
export const mockGetRatingsRecipeThree = {
    request: {
        query: GET_RATINGS,
        variables: { recipeId: mockRecipeIdThree } satisfies GetRatingsQueryVariables,
    },
    result: {
        data: {
            ratingMany: [mockRatingThree],
        } satisfies GetRatingsQuery,
    },
};
export const mockGetRatingsRecipeFour = {
    request: {
        query: GET_RATINGS,
        variables: { recipeId: mockRecipeIdFour } satisfies GetRatingsQueryVariables,
    },
    result: {
        data: {
            ratingMany: [],
        } satisfies GetRatingsQuery,
    },
};
export const mockGetRatingsNewRecipe = {
    request: {
        query: GET_RATINGS,
        variables: { recipeId: mockRecipeIdNew } satisfies GetRatingsQueryVariables,
    },
    result: {
        data: {
            ratingMany: [mockRatingNewOne],
        } satisfies GetRatingsQuery,
    },
};
export const mockGetRatingsNewRecipeAsIngr = {
    request: {
        query: GET_RATINGS,
        variables: { recipeId: mockRecipeIdNewAsIngr } satisfies GetRatingsQueryVariables,
    },
    result: {
        data: {
            ratingMany: [],
        } satisfies GetRatingsQuery,
    },
};
