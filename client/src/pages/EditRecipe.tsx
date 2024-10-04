import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Reference, useMutation, useQuery } from '@apollo/client';

import { useViewStarRating } from '@recipe/features/rating';
import { UPDATE_RECIPE } from '@recipe/graphql/mutations/recipe';
import { RECIPE_FIELDS_SUBSET } from '@recipe/graphql/queries/recipe';
import { useErrorToast, useSuccessToast } from '@recipe/common/hooks';
import { UpdateByIdRecipeModifyInput } from '@recipe/graphql/generated';
import { EditableRecipe, useRecipeState } from '@recipe/features/editing';
import { dbIngredientToFinished } from '@recipe/features/recipeIngredient';
import { GET_RECIPE, RECIPE_INGR_FIELDS } from '@recipe/graphql/queries/recipe';
import { DELAY_LONG, DELAY_SHORT, GRAPHQL_ENDPOINT, ROOT_PATH } from '@recipe/constants';
import { DELETE_IMAGES, IMAGE_FIELDS, UPLOAD_IMAGES } from '@recipe/graphql/mutations/image';

export function EditRecipe() {
    const errorToast = useErrorToast();
    const successToast = useSuccessToast();
    const state = useRecipeState();
    const [recipe, setRecipe] = useState<RecipeView>(null);
    const navigate = useNavigate();
    const { titleIdentifier } = useParams();
    const { avgRating: rating, getRatings, setRating } = useViewStarRating();
    const [saveRecipe, { data: response, loading: recipeLoading }] = useMutation(UPDATE_RECIPE, {
        update(cache, { data }) {
            const { record } = data?.recipeUpdateById || {};
            if (!record) {
                return;
            }
            cache.modify({
                fields: {
                    recipeMany(existing = [], { storeFieldName, readField }) {
                        let newRef;
                        if (storeFieldName === 'recipeMany:{"filter":{"isIngredient":true}}') {
                            if (!record.isIngredient) {
                                return existing;
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
                        if (
                            existing.some((ref: Reference) => readField('_id', ref) === record._id)
                        ) {
                            return existing;
                        }
                        return [newRef, ...existing];
                    },
                },
            });
        },
    });
    const [deleteImages] = useMutation(DELETE_IMAGES, {
        update(cache, { data }) {
            if (!data?.imageRemoveMany?.records || !recipe) {
                return;
            }
            cache.modify({
                id: cache.identify(recipe),
                fields: {
                    images(existing: ReadonlyArray<Reference>, { readField }) {
                        const newRefs = existing.filter(
                            (ref) =>
                                !data.imageRemoveMany?.records?.some(
                                    (deleted) => deleted._id === readField('_id', ref)
                                )
                        );
                        return newRefs;
                    },
                },
            });
        },
    });
    const [uploadImages, { loading: uploadLoading }] = useMutation(UPLOAD_IMAGES, {
        context: { headers: { 'apollo-require-preflight': true } },
        update(cache, { data }) {
            const { records } = data?.imageUploadMany || {};
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
                        const refs = records.map((img) => {
                            return cache.writeFragment({
                                data: img,
                                fragment: IMAGE_FIELDS,
                                fragmentName: 'ImageFields',
                            });
                        });
                        const newRefs = refs.filter((ref) => !existing.includes(ref));
                        return [...existing, ...newRefs];
                    },
                },
            });
        },
    });
    const { data, loading, error } = useQuery(GET_RECIPE, {
        variables: { filter: titleIdentifier ? { titleIdentifier } : {} },
        onCompleted: async (data) => {
            if (!data.recipeOne) {
                return;
            }
            getRatings(data.recipeOne._id);
            const recipe = data.recipeOne;
            setRecipe(recipe);
            state.title.actionHandler.set(recipe.title);
            state.numServings.setNum(recipe.numServings);
            recipe.ingredientSubsections.forEach((sub, index) => {
                state.ingredient.actionHandler.subsection.setTitle(index, sub.name);
                const ingredients = sub.ingredients.map((ing) => {
                    return dbIngredientToFinished(ing);
                });
                state.ingredient.actionHandler.setFinishedArray(index, ingredients);
                if (
                    recipe.ingredientSubsections.length > 1 ||
                    recipe.ingredientSubsections[0].name
                ) {
                    state.ingredient.actionHandler.subsection.add();
                }
            });
            recipe.instructionSubsections.forEach((sub, index) => {
                if (!sub) {
                    return;
                }
                state.instructions.actionHandler.setSubsection(
                    index,
                    [...sub.instructions, ''],
                    sub.name || undefined
                );
                if (
                    recipe.instructionSubsections.length > 1 ||
                    recipe.instructionSubsections[0].name
                ) {
                    state.instructions.actionHandler.addSubsection();
                }
            });
            if (recipe.notes) {
                state.notes.setNotes(recipe.notes);
            }
            state.tags.setTags(
                data.recipeOne.tags.map((tag) => {
                    return {
                        _id: tag._id,
                        value: tag.value,
                        key: crypto.randomUUID(),
                        isNew: false,
                    };
                })
            );
            if (recipe.source) {
                state.source.setSource(recipe.source);
            }
            if (recipe.isIngredient && recipe.pluralTitle) {
                state.asIngredient.actionHandler.toggleIsIngredient();
                state.asIngredient.actionHandler.setPluralTitle(recipe.pluralTitle);
            }
            if (recipe.images) {
                try {
                    const images = await Promise.all(
                        recipe.images.map(async (img) => {
                            const res = await fetch(`${GRAPHQL_ENDPOINT}${img.origUrl}`);
                            const blob = await res.blob();
                            return new File([blob], img.origUrl, { type: blob.type });
                        })
                    );
                    state.images.setImages(images);
                } catch (error) {
                    errorToast({
                        title: 'Error loading images',
                        description: (error as Error).message,
                        position: 'top',
                    });
                }
            }
        },
    });

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error || !data || !data.recipeOne) {
        return <div>Error: {error?.message}</div>;
    }
    const recipeOne = data.recipeOne;

    const handleSubmitMutation = async (recipe: UpdateByIdRecipeModifyInput) => {
        try {
            // Save Recipe
            await saveRecipe({ variables: { id: recipeOne._id, recipe } });
        } catch (error) {
            return errorToast({
                title: 'Error saving recipe',
                description: (error as Error).message,
                position: 'top',
            });
        }
        try {
            // Upload Images
            const originalImages = recipeOne.images ? recipeOne.images : [];
            const newImages = state.images.images;
            const imagesToDelete = originalImages.filter(
                (img) => !newImages.map((img) => img.name).includes(img.origUrl)
            );
            const imagesToAdd = newImages.filter(
                (img) => !originalImages.map((img) => img.origUrl).includes(img.name)
            );
            if (imagesToDelete.length > 0) {
                await deleteImages({ variables: { ids: imagesToDelete.map((img) => img._id) } });
            }
            if (imagesToAdd.length > 0) {
                await uploadImages({
                    variables: { recipeId: recipeOne._id, images: imagesToAdd },
                });
            }
        } catch (error) {
            errorToast({
                title: 'Error uploading images, redirecting you to the home page',
                description: (error as Error).message,
                position: 'top',
            });
            return setTimeout(() => navigate(ROOT_PATH), DELAY_LONG);
        }
        successToast({
            title: 'Recipe saved',
            description: 'Your recipe has been saved, redirecting you to the home page',
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
                submitText: 'Save',
                loadingText: 'Saving Recipe...',
                disabled: !!response,
                loading: recipeLoading || uploadLoading,
            }}
        />
    );
}
