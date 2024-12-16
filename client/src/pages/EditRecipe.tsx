import { useState } from 'react';
import { useShallow } from 'zustand/shallow';
import { useNavigate, useParams } from 'react-router-dom';
import { Reference, useMutation, useQuery } from '@apollo/client';

import { useRecipeStore } from '@recipe/stores';
import { useImagesStore } from '@recipe/features/images';
import { EditableRecipe } from '@recipe/features/editing';
import { useViewStarRating } from '@recipe/features/rating';
import { UPDATE_RECIPE } from '@recipe/graphql/mutations/recipe';
import { RECIPE_FIELDS_SUBSET } from '@recipe/graphql/queries/recipe';
import { useErrorToast, useSuccessToast } from '@recipe/common/hooks';
import { UpdateByIdRecipeModifyInput } from '@recipe/graphql/generated';
import { DELAY_LONG, DELAY_SHORT, GRAPHQL_URL, PATH } from '@recipe/constants';
import { GET_RECIPE, RECIPE_INGR_FIELDS } from '@recipe/graphql/queries/recipe';
import { DELETE_IMAGES, IMAGE_FIELDS, UPLOAD_IMAGES } from '@recipe/graphql/mutations/image';

function queryIngredientToFinished(ingr: RecipeIngredientView): FinishedRecipeIngredient {
    const { quantity, unit, size, ingredient, prepMethod } = ingr;
    const key = crypto.randomUUID();
    if (
        quantity === undefined ||
        unit === undefined ||
        size === undefined ||
        ingredient == undefined ||
        prepMethod === undefined
    ) {
        throw new Error('One or more property is undefined');
    }
    return { key, quantity, unit, size, ingredient, prepMethod };
}

export function EditRecipe() {
    const errorToast = useErrorToast();
    const successToast = useSuccessToast();
    // -- Stores ----------------------------------------------------------
    const { images, setImages } = useImagesStore(
        useShallow((state) => ({ images: state.images, setImages: state.setImages }))
    );
    const recipeState = useRecipeStore(
        useShallow((state) => ({
            setTags: state.setTags,
            setSource: state.setSource,
            setTitle: state.setTitle,
            setNotes: state.setNotes,
            setAsIngredient: state.setAsIngredient,
            setPluralTitle: state.setPluralTitle,
            resetAsIngredient: state.resetAsIngredient,
            setNumServings: state.setNumServings,
            setInstructionSection: state.setInstructionSection,
            addInstructionSection: state.addInstructionSection,
            resetInstructions: state.resetInstructions,
            setIngredientSection: state.setIngredientSection,
            addIngredientSection: state.addIngredientSection,
            resetIngredients: state.resetIngredients,
        }))
    );
    // ---------------------------------------------------------------------
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
    // TODO: if after switching to zustand, simple interaction still triggers re-renders
    // to the entire component, could try refactoring the useQuery and useState recipe into
    // a custom hook that returns the recipe (and loading state?). Hopefully this would
    // prevent the entire component from re-rendering when the recipe isnt being requeried.
    const { data, loading, error } = useQuery(GET_RECIPE, {
        variables: { filter: titleIdentifier ? { titleIdentifier } : {} },
        onCompleted: async (data) => {
            if (!data.recipeOne) {
                return;
            }
            getRatings(data.recipeOne._id);
            const recipe = data.recipeOne;
            setRecipe(recipe);
            recipeState.setTitle(recipe.title);
            recipeState.setNumServings(recipe.numServings);
            recipeState.resetIngredients();
            recipe.ingredientSubsections.forEach((sub, index) => {
                recipeState.setIngredientSection(
                    index,
                    sub.ingredients.map((i) => queryIngredientToFinished(i)),
                    sub.name || undefined
                );
                if (
                    recipe.ingredientSubsections.length > 1 ||
                    recipe.ingredientSubsections[0].name
                ) {
                    recipeState.addIngredientSection();
                }
            });
            recipeState.resetInstructions();
            recipe.instructionSubsections.forEach((sub, index) => {
                recipeState.setInstructionSection(
                    index,
                    [...sub.instructions, ''],
                    sub.name || undefined
                );
                if (
                    recipe.instructionSubsections.length > 1 ||
                    recipe.instructionSubsections[0].name
                ) {
                    recipeState.addInstructionSection();
                }
            });
            if (recipe.notes) {
                recipeState.setNotes(recipe.notes);
            } else {
                recipeState.setNotes('');
            }
            recipeState.setTags(
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
                recipeState.setSource(recipe.source);
            } else {
                recipeState.setSource('');
            }
            if (recipe.isIngredient && recipe.pluralTitle) {
                recipeState.setAsIngredient();
                recipeState.setPluralTitle(recipe.pluralTitle);
            } else {
                recipeState.resetAsIngredient();
            }
            if (recipe.images) {
                try {
                    const images = await Promise.all(
                        recipe.images.map(async (img) => {
                            const res = await fetch(`${GRAPHQL_URL}${img.origUrl}`);
                            const blob = await res.blob();
                            return new File([blob], img.origUrl, { type: blob.type });
                        })
                    );
                    setImages(images);
                } catch (e: unknown) {
                    let description = 'An error occurred while loading images';
                    if (e instanceof Error) {
                        description = e.message;
                    }
                    errorToast({ title: 'Error loading images', description, position: 'top' });
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

    const handleSubmitMutation = async (modifiedRecipe: UpdateByIdRecipeModifyInput) => {
        try {
            // recipe is guaranteed to be defined here because of the error check above
            await saveRecipe({ variables: { id: recipe!._id, recipe: modifiedRecipe } });
        } catch (e: unknown) {
            let description = 'An error occurred while saving the recipe';
            if (e instanceof Error) {
                description = e.message;
            }
            return errorToast({ title: 'Error saving recipe', description, position: 'top' });
        }
        try {
            // Upload Images
            const originalImages = recipe!.images ? recipe!.images : [];
            const imagesToDelete = originalImages.filter(
                (img) => !images.map((img) => img.name).includes(img.origUrl)
            );
            const imagesToAdd = images.filter(
                (img) => !originalImages.map((img) => img.origUrl).includes(img.name)
            );
            if (imagesToDelete.length > 0) {
                await deleteImages({ variables: { ids: imagesToDelete.map((img) => img._id) } });
            }
            if (imagesToAdd.length > 0) {
                await uploadImages({
                    variables: { recipeId: recipe!._id, images: imagesToAdd },
                });
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
            title: 'Recipe saved',
            description: 'Your recipe has been saved, redirecting you to the home page',
            position: 'top',
        });
        setTimeout(() => navigate(PATH.ROOT), DELAY_SHORT);
    };

    return (
        <EditableRecipe
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
