import { useState } from 'react';
import { useToast } from '@chakra-ui/react';
import { useMutation } from '@apollo/client';
import { useNavigate } from 'react-router-dom';

import { ADD_RATING } from '@recipe/graphql/mutations/rating';
import { UPLOAD_IMAGES } from '@recipe/graphql/mutations/image';
import { CREATE_RECIPE } from '@recipe/graphql/mutations/recipe';
import { CreateOneRecipeCreateInput } from '@recipe/graphql/generated';
import { DELAY_LONG, DELAY_SHORT, ROOT_PATH } from '@recipe/constants';
import { EditableRecipe, useRecipeState } from '@recipe/features/editing';

export function CreateRecipe() {
    const toast = useToast();
    const state = useRecipeState();
    const navigate = useNavigate();
    const [rating, setRating] = useState<number>(0);
    const [createRecipe, { loading: recipeLoading, data: response }] = useMutation(CREATE_RECIPE, {
        refetchQueries: ['GetIngredients'],
    });
    const [addRating, { loading: ratingLoading }] = useMutation(ADD_RATING);
    const [uploadImages, { loading: uploadLoading }] = useMutation(UPLOAD_IMAGES, {
        context: { headers: { 'apollo-require-preflight': true } },
    });

    const handleSubmitMutation = async (recipe: CreateOneRecipeCreateInput) => {
        let recipeId: string;
        try {
            // Create Recipe
            const result = await createRecipe({ variables: { recipe } });
            recipeId = result.data?.recipeCreateOne?.record?._id;
        } catch (error) {
            return toast({
                title: 'Error creating recipe',
                description: (error as Error).message,
                status: 'error',
                position: 'top',
                duration: DELAY_LONG,
            });
        }
        try {
            // Add Rating
            if (rating !== 0) {
                await addRating({ variables: { recipeId, rating } });
            }
        } catch (error) {
            toast({
                title: 'Error adding rating to recipe, redirecting you to the home page',
                description: (error as Error).message,
                status: 'error',
                position: 'top',
                duration: DELAY_LONG,
            });
            return setTimeout(() => navigate(ROOT_PATH), DELAY_LONG);
        }

        try {
            // Upload Images
            if (state.images.images.length > 0) {
                await uploadImages({ variables: { recipeId, images: state.images.images } });
            }
        } catch (error) {
            toast({
                title: 'Error uploading images, redirecting you to the home page',
                description: (error as Error).message,
                status: 'error',
                position: 'top',
                duration: DELAY_LONG,
            });
            return setTimeout(() => navigate(ROOT_PATH), DELAY_LONG);
        }
        toast({
            title: 'Recipe created',
            description: 'Your recipe has been created, redirecting you to the home page',
            status: 'success',
            position: 'top',
            duration: 1500,
        });
        setTimeout(() => navigate(ROOT_PATH), DELAY_SHORT);
    };
    return (
        <EditableRecipe
            state={state}
            rating={{ rating, setRating }}
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
