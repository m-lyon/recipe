import { Button } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useShallow } from 'zustand/shallow';
import { useNavigate, useParams } from 'react-router-dom';
import { Reference, useMutation, useQuery } from '@apollo/client';

import { useUploadImages } from '@recipe/features/images';
import { GET_RECIPE } from '@recipe/graphql/queries/recipe';
import { updateRecipeCache } from '@recipe/features/editing';
import { useImagesStore, useRecipeStore } from '@recipe/stores';
import { DELETE_IMAGES } from '@recipe/graphql/mutations/image';
import { UpdateByIdRecipeModifyInput } from '@recipe/graphql/generated';
import { getAverageRating, useAddRating } from '@recipe/features/rating';
import { DELAY_LONG, DELAY_SHORT, GRAPHQL_URL, PATH } from '@recipe/constants';
import { ConfirmModal, deleteVeganRecipeCache } from '@recipe/features/editing';
import { useErrorToast, useSuccessToast, useWarningToast } from '@recipe/common/hooks';
import { archiveRecipeCache, archiveRecipeConfirmConfig } from '@recipe/features/editing';
import { EditableRecipe, deleteVeganVersionConfirmConfig } from '@recipe/features/editing';
import { ARCHIVE_RECIPE, DELETE_RECIPE, UPDATE_RECIPE } from '@recipe/graphql/mutations/recipe';

import { queryIngredientToFinished } from './utils';

export function EditRecipe() {
    const errorToast = useErrorToast();
    const successToast = useSuccessToast();
    const warningToast = useWarningToast();
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
            createVeganVersion: state.createVeganVersion,
            setCreateVeganVersion: state.setCreateVeganVersion,
            resetCreateVeganVersion: state.resetCreateVeganVersion,
        }))
    );
    // ---------------------------------------------------------------------
    const [recipe, setRecipe] = useState<RecipeView>(null);
    const [showConfirmAction, setShowConfirmAction] = useState(false);
    const [isRedirectingAfterDestructiveAction, setIsRedirectingAfterDestructiveAction] =
        useState(false);
    const navigate = useNavigate();
    const { titleIdentifier } = useParams();
    const [saveRecipe, { data: response, loading: recipeLoading, reset: resetSaveRecipe }] =
        useMutation(UPDATE_RECIPE, {
            update(cache, { data }) {
                const { record } = data?.recipeUpdateById || {};
                if (!record) {
                    return;
                }
                updateRecipeCache(cache, record);
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
    const [archiveRecipe] = useMutation(ARCHIVE_RECIPE);
    const [deleteRecipe] = useMutation(DELETE_RECIPE);
    const { uploadImages, loading: uploadLoading } = useUploadImages();
    useEffect(() => {
        resetSaveRecipe();
    }, [resetSaveRecipe, titleIdentifier]);
    const { data, loading, error } = useQuery(GET_RECIPE, {
        variables: { filter: titleIdentifier ? { titleIdentifier } : {} },
        onCompleted: async (data) => {
            if (!data.recipeOne) {
                return;
            }
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
            recipeState.setCreateVeganVersion(!!recipe.veganVersion);
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
    const { addRatingWithToast } = useAddRating();

    if (loading) {
        return <div>Loading...</div>;
    }

    if (isRedirectingAfterDestructiveAction) {
        return <div>Loading...</div>;
    }

    if (error || !data || !data.recipeOne) {
        return <div>Error: {error?.message}</div>;
    }

    const handleSubmitMutation = async (modifiedRecipe: UpdateByIdRecipeModifyInput) => {
        let savedRecipe: RecipeView | null = null;

        try {
            // recipe is guaranteed to be defined here because of the error check above
            const saveResult = await saveRecipe({
                variables: { id: recipe!._id, recipe: modifiedRecipe },
            });
            savedRecipe = saveResult.data?.recipeUpdateById?.record ?? null;
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
                await uploadImages(imagesToAdd, recipe);
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
        const currentRecipe = savedRecipe ?? data.recipeOne;

        if (recipeState.createVeganVersion) {
            if (currentRecipe?.calculatedTags.includes('vegan')) {
                recipeState.resetCreateVeganVersion();
                warningToast({
                    title: 'Recipe is already vegan',
                    description: 'This recipe does not need a vegan version',
                    position: 'top',
                });
                // fall through to normal save redirect
            } else if (currentRecipe?.veganVersion) {
                const veganTitleIdentifier = currentRecipe.veganVersion.titleIdentifier;
                successToast({
                    title: 'Redirecting to existing vegan version',
                    description: 'This recipe already has a vegan version',
                    position: 'top',
                });
                return setTimeout(() => {
                    recipeState.resetCreateVeganVersion();
                    navigate(`${PATH.ROOT}/edit/recipe/${veganTitleIdentifier}`);
                }, DELAY_SHORT);
            } else {
                if (!savedRecipe?.titleIdentifier) {
                    resetSaveRecipe();
                    return errorToast({
                        title: 'Error saving recipe',
                        description: 'No saved recipe was returned from the server',
                        position: 'top',
                    });
                }

                successToast({
                    title: 'Creating vegan version',
                    description: 'Redirecting you to the vegan recipe page',
                    position: 'top',
                });
                return setTimeout(() => {
                    recipeState.resetCreateVeganVersion();
                    navigate(`${PATH.ROOT}/create/recipe/vegan/${savedRecipe.titleIdentifier}`);
                }, DELAY_SHORT);
            }
        }
        successToast({
            title: 'Recipe saved',
            description: 'Your recipe has been saved, redirecting you to the home page',
            position: 'top',
        });
        setTimeout(() => navigate(PATH.ROOT), DELAY_SHORT);
    };

    const destructiveAction = data.recipeOne.originalRecipe
        ? deleteVeganVersionConfirmConfig
        : archiveRecipeConfirmConfig;

    const handleDestructiveAction = async () => {
        if (!recipe) {
            return;
        }

        try {
            if (recipe.originalRecipe) {
                await deleteRecipe({
                    variables: { id: recipe._id },
                    update(cache, { data: deleteData }) {
                        if (!deleteData?.recipeRemoveById?.recordId) {
                            return;
                        }
                        deleteVeganRecipeCache(cache, recipe);
                    },
                });
                successToast({
                    title: 'Vegan version deleted',
                    description: 'Redirecting you to the home page',
                    position: 'top',
                });
                setIsRedirectingAfterDestructiveAction(true);
            } else {
                await archiveRecipe({
                    variables: { id: recipe._id },
                    update(cache, { data: archiveData }) {
                        if (!archiveData?.recipeArchiveById?.recordId) {
                            return;
                        }
                        archiveRecipeCache(cache, recipe);
                    },
                });
                successToast({
                    title: 'Recipe archived',
                    description: 'Redirecting you to the home page',
                    position: 'top',
                });
                setIsRedirectingAfterDestructiveAction(true);
            }
        } catch (e: unknown) {
            let description = 'An error occurred while updating the recipe';
            if (e instanceof Error) {
                description = e.message;
            }

            return errorToast({
                title: recipe.originalRecipe
                    ? 'Error deleting vegan version'
                    : 'Error archiving recipe',
                description,
                position: 'top',
            });
        }

        setTimeout(() => navigate(PATH.ROOT), DELAY_SHORT);
    };

    return (
        <>
            <EditableRecipe
                rating={getAverageRating(data.recipeOne.ratings)}
                addRating={(rating: number) => addRatingWithToast(rating, data.recipeOne)}
                handleSubmitMutation={handleSubmitMutation}
                veganVersion={data.recipeOne.veganVersion ?? undefined}
                originalRecipe={data.recipeOne.originalRecipe ?? undefined}
                secondaryActionButton={
                    <Button
                        size='lg'
                        borderRadius='full'
                        colorScheme='red'
                        variant='outline'
                        aria-label={destructiveAction.buttonLabel}
                        onClick={() => setShowConfirmAction(true)}
                    >
                        {destructiveAction.buttonLabel}
                    </Button>
                }
                submitButtonProps={{
                    submitText: 'Save',
                    loadingText: 'Saving Recipe...',
                    disabled: !!response,
                    loading: recipeLoading || uploadLoading,
                }}
            />
            <ConfirmModal
                show={showConfirmAction}
                setShow={setShowConfirmAction}
                title={destructiveAction.title}
                body={destructiveAction.body}
                cancelAriaLabel={destructiveAction.cancelAriaLabel}
                confirmAriaLabel={destructiveAction.confirmAriaLabel}
                onConfirm={handleDestructiveAction}
            />
        </>
    );
}
