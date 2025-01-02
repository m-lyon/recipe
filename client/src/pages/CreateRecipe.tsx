import { useEffect, useState } from 'react';
import { useShallow } from 'zustand/shallow';
import { useMutation } from '@apollo/client';
import { useNavigate } from 'react-router-dom';

import { useAddRating } from '@recipe/features/rating';
import { useUploadImages } from '@recipe/features/images';
import { useImagesStore, useRecipeStore } from '@recipe/stores';
import { CREATE_RECIPE } from '@recipe/graphql/mutations/recipe';
import { DELAY_LONG, DELAY_SHORT, PATH } from '@recipe/constants';
import { useErrorToast, useSuccessToast } from '@recipe/common/hooks';
import { CreateOneRecipeCreateInput } from '@recipe/graphql/generated';
import { EditableRecipe, updateRecipeCache } from '@recipe/features/editing';

export function CreateRecipe() {
    const errorToast = useErrorToast();
    const successToast = useSuccessToast();
    const navigate = useNavigate();
    const [rating, setRating] = useState<number>(0);
    // -- Stores ----------------------------------------------------------
    const { images, resetImages } = useImagesStore(
        useShallow((state) => ({ images: state.images, resetImages: state.resetImages }))
    );
    const resetRecipe = useRecipeStore((state) => state.resetRecipe);
    useEffect(() => {
        // Resets on unmount and mount
        resetImages();
        resetRecipe();
        return () => {
            resetImages();
            resetRecipe();
        };
    }, [resetImages, resetRecipe]);
    // --------------------------------------------------------------------
    const [createRecipe, { loading: recipeLoading, data: response }] = useMutation(CREATE_RECIPE, {
        update(cache, { data }) {
            const { record } = data?.recipeCreateOne || {};
            if (!record) {
                return;
            }
            updateRecipeCache(cache, record, true);
        },
    });
    const { addRating, loading: ratingLoading } = useAddRating();
    const { uploadImages, loading: uploadLoading } = useUploadImages();

    const handleSubmitMutation = async (recipe: CreateOneRecipeCreateInput) => {
        let recipeResult: RecipeView;
        try {
            // Create Recipe
            const result = await createRecipe({ variables: { recipe } });
            recipeResult = result.data?.recipeCreateOne?.record;
        } catch (e) {
            let description = 'An error occurred while creating the recipe';
            if (e instanceof Error) {
                description = e.message;
            }
            return errorToast({ title: 'Error creating recipe', description, position: 'top' });
        }
        try {
            // Add Rating
            if (rating !== 0) {
                await addRating(rating, recipeResult);
            }
        } catch (e: unknown) {
            let description = 'An error occurred while adding the rating to the recipe';
            if (e instanceof Error) {
                description = e.message;
            }
            errorToast({
                title: 'Error adding rating to recipe, redirecting you to the home page',
                description,
                position: 'top',
            });
            return setTimeout(() => navigate(PATH.ROOT), DELAY_LONG);
        }

        try {
            // Upload Images
            if (images.length > 0) {
                await uploadImages(images, recipeResult);
            }
        } catch (e: unknown) {
            let description = 'An error occurred while uploading images';
            if (e instanceof Error) {
                description = e.message;
            }
            errorToast({
                title: 'Error uploading images, redirecting you to the home page',
                description,
                position: 'top',
            });
            return setTimeout(() => navigate(PATH.ROOT), DELAY_LONG);
        }
        successToast({
            title: 'Recipe created',
            description: 'Your recipe has been created, redirecting you to the home page',
            position: 'top',
        });
        setTimeout(() => navigate(PATH.ROOT), DELAY_SHORT);
    };

    return (
        <EditableRecipe
            rating={rating}
            addRating={setRating}
            handleSubmitMutation={handleSubmitMutation}
            submitButtonProps={{
                submitText: 'Submit',
                loadingText:
                    recipeLoading || ratingLoading
                        ? 'Submitting Recipe...'
                        : uploadLoading
                          ? 'Uploading Images...'
                          : undefined,
                disabled: !!response,
                loading: recipeLoading || ratingLoading || uploadLoading,
            }}
        />
    );
}
