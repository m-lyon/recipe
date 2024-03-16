import { useLazyQuery, useMutation } from '@apollo/client';
import { useToast } from '@chakra-ui/react';
import { useState } from 'react';
import { GET_RATINGS } from '../graphql/queries/rating';
import { ADD_RATING } from '../graphql/mutations/rating';

export function useViewStarRating() {
    const toast = useToast();
    const [recipeId, setRecipeId] = useState<string | undefined>(undefined);
    const [handleGetRatings, { data }] = useLazyQuery(GET_RATINGS);
    const [addRating] = useMutation(ADD_RATING, { refetchQueries: ['GetRatings'] });

    const getRatings = (recipeId: string) => {
        setRecipeId(recipeId);
        return handleGetRatings({ variables: { recipeId } });
    };

    const setRating = (rating: number) => {
        if (!recipeId) {
            toast({
                title: 'Error adding rating',
                status: 'error',
                position: 'top',
                duration: 1500,
            });
            return;
        }
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

    return { avgRating, getRatings, setRating };
}
