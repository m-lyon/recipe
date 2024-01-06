import { useQuery, useMutation } from '@apollo/client';
import { gql } from '../../../__generated__';
import { AddRating } from '../../CreateRecipe';
import { useToast } from '@chakra-ui/react';

const GET_RATINGS = gql(`
    query GetRatings($recipeId: MongoID!) {
        ratingMany(filter: { recipe: $recipeId }) {
            _id
            value
        }
    }
`);

export function useViewStarRating(recipeId: string) {
    const { data } = useQuery(GET_RATINGS, {
        variables: { recipeId },
    });
    const toast = useToast();
    const [addRating] = useMutation(AddRating, { refetchQueries: ['GetRatings'] });

    const setRating = (rating: number) => {
        addRating({ variables: { recipeId, rating } })
            .then(() => {
                toast({
                    title: 'Rating added',
                    status: 'success',
                    position: 'top',
                    duration: 1500,
                });
            })
            .catch(() => {
                toast({
                    title: 'Error adding rating',
                    status: 'error',
                    position: 'top',
                    duration: 1500,
                });
            });
    };

    const avgRating = data
        ? data.ratingMany.reduce((sum, record) => sum + record.value, 0) / data.ratingMany.length
        : 0;

    return { avgRating, setRating };
}
