import { GET_RATINGS } from '@recipe/graphql/queries/rating';
import { mockRecipeIdThree, mockRecipeIdTwo } from '@recipe/graphql/__mocks__/ids';
import { mockRatingIdNewOne, mockRecipeIdOne } from '@recipe/graphql/__mocks__/ids';
import { mockRatingIdNewTwo, mockRecipeIdFour } from '@recipe/graphql/__mocks__/ids';
import { mockRecipeIdNew, mockRecipeIdNewAsIngr } from '@recipe/graphql/__mocks__/ids';
import { GetRatingsQuery, GetRatingsQueryVariables, Rating } from '@recipe/graphql/generated';
import { mockRatingIdOne, mockRatingIdThree, mockRatingIdTwo } from '@recipe/graphql/__mocks__/ids';

import { mockAdmin } from './user';
import { mockRecipeNew, mockRecipeOne, mockRecipeThree, mockRecipeTwo } from './recipe';

export const mockRatingOne: Rating = {
    __typename: 'Rating',
    _id: mockRatingIdOne,
    owner: mockAdmin,
    recipe: mockRecipeOne,
    value: 3.0,
};
export const mockRatingTwo: Rating = {
    __typename: 'Rating',
    _id: mockRatingIdTwo,
    owner: mockAdmin,
    recipe: mockRecipeTwo,
    value: 4.0,
};
export const mockRatingThree: Rating = {
    __typename: 'Rating',
    _id: mockRatingIdThree,
    owner: mockAdmin,
    recipe: mockRecipeThree,
    value: 5.0,
};
export const mockRatingNewOne: Rating = {
    __typename: 'Rating',
    _id: mockRatingIdNewOne,
    owner: mockAdmin,
    recipe: mockRecipeNew,
    value: 1.5,
};
export const mockRatingNewTwo: Rating = {
    __typename: 'Rating',
    _id: mockRatingIdNewTwo,
    owner: mockAdmin,
    recipe: mockRecipeOne,
    value: 1.5,
};
export const mockGetRatingsRecipeOne = {
    request: {
        query: GET_RATINGS,
        variables: { recipeId: mockRecipeIdOne } satisfies GetRatingsQueryVariables,
    },
    result: {
        data: {
            __typename: 'Query',
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
            __typename: 'Query',
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
            __typename: 'Query',
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
            __typename: 'Query',
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
            __typename: 'Query',
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
            __typename: 'Query',
            ratingMany: [],
        } satisfies GetRatingsQuery,
    },
};
