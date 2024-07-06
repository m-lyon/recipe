import { useState } from 'react';
import { useToast } from '@chakra-ui/react';
import { useLazyQuery, useMutation } from '@apollo/client';

import { ADD_RATING } from '@recipe/graphql/mutations/rating';
import { GET_RATINGS, RATING_FIELDS } from '@recipe/graphql/queries/rating';

export function useViewStarRating() {
    const toast = useToast();
    const [recipeId, setRecipeId] = useState<string | undefined>(undefined);
    const [handleGetRatings, { data }] = useLazyQuery(GET_RATINGS);
    const [addRating] = useMutation(ADD_RATING, {
        update(cache, { data }) {
            const { record } = data?.ratingCreateOne || {};
            if (!record || !recipeId) {
                return;
            }
            cache.modify({
                fields: {
                    ratingMany(existing = []) {
                        try {
                            const newRatingRef = cache.writeFragment({
                                data: record,
                                fragment: RATING_FIELDS,
                            });
                            return [...existing, newRatingRef];
                        } catch (error) {
                            console.error('Error writing fragment to cache', error);
                            return existing;
                        }
                    },
                },
            });
        },
    });

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
    const avgRating =
        data && data.ratingMany.length > 0
            ? data.ratingMany.reduce((sum, record) => sum + record.value, 0) /
              data.ratingMany.length
            : 0;

    return { avgRating, getRatings, setRating };
}
