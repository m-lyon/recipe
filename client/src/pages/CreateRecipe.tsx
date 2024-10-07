import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { useNavigate } from 'react-router-dom';

import { ADD_RATING } from '@recipe/graphql/mutations/rating';
import { CREATE_RECIPE } from '@recipe/graphql/mutations/recipe';
import { useErrorToast, useSuccessToast } from '@recipe/common/hooks';
import { CreateOneRecipeCreateInput } from '@recipe/graphql/generated';
import { DELAY_LONG, DELAY_SHORT, ROOT_PATH } from '@recipe/constants';
import { EditableRecipe, useRecipeState } from '@recipe/features/editing';
import { IMAGE_FIELDS, UPLOAD_IMAGES } from '@recipe/graphql/mutations/image';
import { RECIPE_FIELDS_SUBSET, RECIPE_INGR_FIELDS } from '@recipe/graphql/queries/recipe';

export function CreateRecipe() {
    const errorToast = useErrorToast();
    const successToast = useSuccessToast();
    const state = useRecipeState();
    const navigate = useNavigate();
    const [rating, setRating] = useState<number>(0);
    const [createRecipe, { loading: recipeLoading, data: response }] = useMutation(CREATE_RECIPE, {
        update(cache, { data }) {
            const { record } = data?.recipeCreateOne || {};
            if (!record) {
                return;
            }
            cache.modify({
                fields: {
                    recipeMany(existingRecipes = [], { storeFieldName }) {
                        let newRef;
                        if (storeFieldName === 'recipeMany:{"filter":{"isIngredient":true}}') {
                            if (!record.isIngredient) {
                                return existingRecipes;
                            }
                            newRef = cache.writeFragment({
                                data: record,
                                fragment: RECIPE_INGR_FIELDS,
                                fragmentName: 'RecipeIngrFields',
                            });
                        } else {
                            newRef = cache.writeFragment({
                                data: record,
                                fragment: RECIPE_FIELDS_SUBSET,
                                fragmentName: 'RecipeFieldsSubset',
                            });
                        }
                        return [newRef, ...existingRecipes];
                    },
                    recipeCount: (existingCount) => existingCount + 1,
                },
            });
        },
    });
    const [addRating, { loading: ratingLoading }] = useMutation(ADD_RATING);
    const [uploadImages, { loading: uploadLoading }] = useMutation(UPLOAD_IMAGES, {
        context: { headers: { 'apollo-require-preflight': true } },
        update(cache, { data }) {
            const { records } = data?.imageUploadMany || {};
            const { record: recipe } = response?.recipeCreateOne || { record: undefined };
            if (!records || !recipe) {
                return;
            }
            cache.modify({
                id: cache.identify(recipe),
                fields: {
                    images(existing) {
                        if (!records) {
                            return existing;
                        }
                        try {
                            const refs = records.map((img) => {
                                return cache.writeFragment({
                                    data: img,
                                    fragment: IMAGE_FIELDS,
                                    fragmentName: 'ImageFields',
                                });
                            });
                            return refs;
                        } catch (error) {
                            console.error('Error writing fragments to cache', error);
                            return existing;
                        }
                    },
                },
            });
        },
    });

    const handleSubmitMutation = async (recipe: CreateOneRecipeCreateInput) => {
        let recipeId: string;
        try {
            // Create Recipe
            const result = await createRecipe({ variables: { recipe } });
            recipeId = result.data?.recipeCreateOne?.record?._id;
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
                await addRating({ variables: { recipeId, rating } });
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
            return setTimeout(() => navigate(ROOT_PATH), DELAY_LONG);
        }

        try {
            // Upload Images
            if (state.images.images.length > 0) {
                await uploadImages({ variables: { recipeId, images: state.images.images } });
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
            return setTimeout(() => navigate(ROOT_PATH), DELAY_LONG);
        }
        successToast({
            title: 'Recipe created',
            description: 'Your recipe has been created, redirecting you to the home page',
            position: 'top',
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
