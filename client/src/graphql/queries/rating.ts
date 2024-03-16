import { gql } from '../../__generated__';

export const GET_RATINGS = gql(`
    query GetRatings($recipeId: MongoID!) {
        ratingMany(filter: { recipe: $recipeId }) {
            _id
            value
        }
    }
`);
