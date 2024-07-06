import { gql } from '../../__generated__';

export const RATING_FIELDS = gql(`
    fragment RatingFields on Rating {
        _id
        value
    }
`);

export const GET_RATINGS = gql(`
    query GetRatings($recipeId: MongoID!) {
        ratingMany(filter: { recipe: $recipeId }) {
            ...RatingFields
        }
    }
`);
