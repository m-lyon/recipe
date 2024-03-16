import { gql } from '../../__generated__';

export const ADD_RATING = gql(`
    mutation AddRating($recipeId: MongoID!, $rating: Float!) {
        ratingCreateOne(record: { recipe: $recipeId, value: $rating }) {
            record {
                _id
                value
            }
        }
    }
`);
