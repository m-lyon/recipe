import { Button } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useShallow } from 'zustand/shallow';
import { useNavigate, useParams } from 'react-router-dom';
import { ApolloError, Reference, useMutation, useQuery } from '@apollo/client';

import { ConfirmModal } from '@recipe/common/components';
import { useUploadImages } from '@recipe/features/images';
import { BraisingLoader } from '@recipe/common/components';
import { GET_RECIPE } from '@recipe/graphql/queries/recipe';
import { updateRecipeCache } from '@recipe/features/editing';
import { useImagesStore, useRecipeStore } from '@recipe/stores';
import { DELETE_IMAGES } from '@recipe/graphql/mutations/image';
import { UpdateByIdRecipeModifyInput } from '@recipe/graphql/generated';
import { getAverageRating, useAddRating } from '@recipe/features/rating';
import { DELAY_LONG, DELAY_SHORT, GRAPHQL_URL, PATH } from '@recipe/constants';
import { SubmitButton, deleteVeganRecipeCache } from '@recipe/features/editing';
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
    // Identifier of the recipe the store is currently hydrated for. Rendering before
    // hydration paints stale store content, then re-keyed items exit/enter via
    // AnimatePresence and the page visibly collapses when the exits finish.
    const [hydratedFor, setHydratedFor] = useState<string | null>(null);
    const [showConfirmAction, setShowConfirmAction] = useState(false);
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
    });
    // Hydrate the recipe store from the query result. This runs as an effect keyed
    // on the route identifier rather than as onCompleted: Apollo does not reliably
    // re-invoke onCompleted when the query variables change (e.g. the redirect from
    // a recipe to its vegan version), and with cached data it can fire before other
    // mount effects, which would let a mount-time reset wipe the hydrated store.
    useEffect(() => {
        const recipe = data?.recipeOne;
        if (loading || !recipe || hydratedFor === (titleIdentifier ?? '')) {
            return;
        }
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
            if (recipe.ingredientSubsections.length > 1 || recipe.ingredientSubsections[0].name) {
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
            if (recipe.instructionSubsections.length > 1 || recipe.instructionSubsections[0].name) {
                recipeState.addInstructionSection();
            }
        });
        if (recipe.notes) {
            recipeState.setNotes(recipe.notes);
        } else {
            recipeState.setNotes('');
        }
        recipeState.setTags(
            recipe.tags.map((tag) => {
                return {
                    _id: tag._id,
                    value: tag.value,
                    key: tag._id,
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
        // Store hydration is complete; images load in below without shifting the
        // content above them, so don't hold up rendering for the fetch.
        setHydratedFor(titleIdentifier ?? '');
        if (recipe.images) {
            Promise.all(
                recipe.images.map(async (img) => {
                    const res = await fetch(`${GRAPHQL_URL}${img.origUrl}`);
                    const blob = await res.blob();
                    return new File([blob], img.origUrl, { type: blob.type });
                })
            )
                .then(setImages)
                .catch((e: unknown) => {
                    let description = 'An error occurred while loading images';
                    if (e instanceof Error) {
                        description = e.message;
                    }
                    errorToast({ title: 'Error loading images', description, position: 'top' });
                });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data, loading, titleIdentifier, hydratedFor]);
    const { addRatingWithToast } = useAddRating();

    if (error || (!loading && !data?.recipeOne)) {
        return <div>Error: {error?.message}</div>;
    }

    if (loading || !data?.recipeOne || hydratedFor !== (titleIdentifier ?? '')) {
        return <BraisingLoader h='100vh' />;
    }

    const handleSubmitMutation = async (modifiedRecipe: UpdateByIdRecipeModifyInput) => {
        let savedRecipe: RecipeView | null = null;

        try {
            const saveResult = await saveRecipe({
                // recipe is guaranteed to be defined here because of the error check above
                variables: { id: recipe!._id, recipe: modifiedRecipe },
            });
            savedRecipe = saveResult.data?.recipeUpdateById?.record ?? null;
        } catch (e: unknown) {
            if (
                e instanceof ApolloError &&
                e.graphQLErrors.some((err) => err.extensions?.code === 'ORIGINAL_RECIPE_IS_VEGAN')
            ) {
                return warningToast({
                    title: 'Recipe already has linked vegan version',
                    description: 'Cannot save recipe as vegan when it has a linked vegan version',
                    position: 'top',
                });
            }
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
                    position: 'top',
                });
                // fall through to normal save redirect
            } else if (currentRecipe?.veganVersion) {
                const veganTitleIdentifier = currentRecipe.veganVersion.titleIdentifier;
                successToast({
                    title: 'Redirecting to existing vegan version',
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
                veganVersion={data.recipeOne.veganVersion ?? undefined}
                originalRecipe={data.recipeOne.originalRecipe ?? undefined}
                submitButton={
                    <SubmitButton
                        submitText='Save'
                        disabled={!!response}
                        loading={recipeLoading || uploadLoading}
                        handleSubmit={handleSubmitMutation}
                        ariaLabel={
                            data.recipeOne.originalRecipe ? 'Save vegan version' : 'Save recipe'
                        }
                    />
                }
                secondaryActionButton={
                    <Button
                        size='lg'
                        borderRadius='full'
                        colorScheme='red'
                        variant='outline'
                        backgroundColor='white'
                        aria-label={destructiveAction.buttonLabel}
                        onClick={() => setShowConfirmAction(true)}
                    >
                        {destructiveAction.buttonLabel}
                    </Button>
                }
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
