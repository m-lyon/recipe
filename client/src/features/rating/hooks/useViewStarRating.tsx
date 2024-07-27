import { useState } from 'react';
import { useLazyQuery, useMutation } from '@apollo/client';

import { ADD_RATING } from '@recipe/graphql/mutations/rating';
import { useErrorToast, useSuccessToast } from '@recipe/common/hooks';
import { GET_RATINGS, RATING_FIELDS } from '@recipe/graphql/queries/rating';

export function useViewStarRating() {
    const errorToast = useErrorToast();
    const successToast = useSuccessToast();
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
            errorToast({ title: 'Error adding rating', position: 'top' });
            return;
        }
        addRating({ variables: { recipeId, rating } })
            .then(() => {
                successToast({ title: 'Rating added', position: 'top' });
            })
            .catch(() => {
                errorToast({ title: 'Error adding rating', position: 'top' });
            });
    };
    const avgRating =
        data && data.ratingMany.length > 0
            ? data.ratingMany.reduce((sum, record) => sum + record.value, 0) /
              data.ratingMany.length
            : 0;

    return { avgRating, getRatings, setRating };
}
