import { Reference, useMutation } from '@apollo/client';

import { ADD_RATING } from '@recipe/graphql/mutations/rating';
import { RATING_FIELDS } from '@recipe/graphql/queries/rating';
import { useErrorToast, useSuccessToast } from '@recipe/common/hooks';

export function useAddRating() {
    const errorToast = useErrorToast();
    const successToast = useSuccessToast();
    const [addRatingMutation, { loading }] = useMutation(ADD_RATING);

    const addRating = (rating: number, recipe: RecipeView) => {
        if (!recipe) {
            throw new Error('Recipe not found');
        }
        return addRatingMutation({
            variables: { recipeId: recipe._id, rating },
            update(cache, { data }) {
                const { record } = data?.ratingCreateOne || {};
                if (!record) {
                    return;
                }
                cache.modify({
                    id: cache.identify(recipe),
                    fields: {
                        ratings(existing, { readField }) {
                            const ref = cache.writeFragment({
                                data: record,
                                fragment: RATING_FIELDS,
                            });
                            if (
                                existing.some((r: Reference) => readField('_id', r) === record._id)
                            ) {
                                return existing;
                            }
                            return [...existing, ref];
                        },
                    },
                });
            },
        });
    };

    const addRatingWithToast = (rating: number, recipe: RecipeView) => {
        addRating(rating, recipe)
            .then(() => successToast({ title: 'Rating added', position: 'top' }))
            .catch(() => errorToast({ title: 'Error adding rating', position: 'top' }));
    };

    return { addRating, addRatingWithToast, loading };
}
