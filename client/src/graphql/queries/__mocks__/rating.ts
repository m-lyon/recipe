import { mockRatingIdNewOne } from '@recipe/graphql/__mocks__/ids';
import { mockRatingIdNewTwo } from '@recipe/graphql/__mocks__/ids';
import { mockRatingIdOne, mockRatingIdThree, mockRatingIdTwo } from '@recipe/graphql/__mocks__/ids';

export const mockRatingOne: RatingView = {
    __typename: 'Rating',
    _id: mockRatingIdOne,
    value: 3.0,
};
export const mockRatingTwo: RatingView = {
    __typename: 'Rating',
    _id: mockRatingIdTwo,
    value: 4.0,
};
export const mockRatingThree: RatingView = {
    __typename: 'Rating',
    _id: mockRatingIdThree,
    value: 5.0,
};
export const mockRatingNewOne: RatingView = {
    __typename: 'Rating',
    _id: mockRatingIdNewOne,
    value: 1.5,
};
export const mockRatingNewTwo: RatingView = {
    __typename: 'Rating',
    _id: mockRatingIdNewTwo,
    value: 1.5,
};
