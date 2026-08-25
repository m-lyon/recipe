import { useEffect, useState } from 'react';
import { useShallow } from 'zustand/shallow';
import { useNavigate, useParams } from 'react-router-dom';
import { Reference, gql, useMutation, useQuery } from '@apollo/client';

import { ReservedTags } from '@recipe/graphql/enums';
import { useAddRating } from '@recipe/features/rating';
import { useUploadImages } from '@recipe/features/images';
import { BraisingLoader } from '@recipe/common/components';
import { GET_RECIPE } from '@recipe/graphql/queries/recipe';
import { formatCalculatedTag } from '@recipe/features/tags';
import { useImagesStore, useRecipeStore } from '@recipe/stores';
import { useErrorToast, useSuccessToast } from '@recipe/common/hooks';
import { CreateOneRecipeCreateInput } from '@recipe/graphql/generated';
import { CREATE_VEGAN_RECIPE } from '@recipe/graphql/mutations/recipe';
import { DELAY_LONG, DELAY_SHORT, GRAPHQL_URL, PATH } from '@recipe/constants';
import { EditableRecipe, SubmitButton, updateRecipeCache } from '@recipe/features/editing';

import { queryIngredientToFinished } from './utils';

const VEGAN_VERSION_LINK_FRAGMENT = gql`
    fragment VeganVersionLink on Recipe {
        veganVersion {
            _id
            title
            titleIdentifier
        }
    }
`;

const VEGAN_ORIGINAL_LINK_FRAGMENT = gql(`
    fragment VeganOriginalLink on Recipe {
        originalRecipe {
            _id
        }
    }
`);

export function CreateVeganRecipe() {
    const { originalTitleIdentifier } = useParams<{ originalTitleIdentifier: string }>();
    const navigate = useNavigate();
    const errorToast = useErrorToast();
    const successToast = useSuccessToast();
    const [rating, setRating] = useState<number>(0);
    // Identifier of the recipe the store is currently hydrated for. Rendering before
    // hydration paints stale store content, then re-keyed items exit/enter via
    // AnimatePresence and the page visibly collapses when the exits finish.
    const [hydratedFor, setHydratedFor] = useState<string | null>(null);

    const { images, setImages, resetImages } = useImagesStore(
        useShallow((state) => ({
            images: state.images,
            setImages: state.setImages,
            resetImages: state.resetImages,
        }))
    );
    const recipeState = useRecipeStore(
        useShallow((state) => ({
            setTitle: state.setTitle,
            setNumServings: state.setNumServings,
            resetIngredients: state.resetIngredients,
            setIngredientSection: state.setIngredientSection,
            addIngredientSection: state.addIngredientSection,
            resetInstructions: state.resetInstructions,
            setInstructionSection: state.setInstructionSection,
            addInstructionSection: state.addInstructionSection,
            setNotes: state.setNotes,
            setTags: state.setTags,
            setSource: state.setSource,
            setAsIngredient: state.setAsIngredient,
            setPluralTitle: state.setPluralTitle,
            resetAsIngredient: state.resetAsIngredient,
            resetRecipe: state.resetRecipe,
            resetCreateVeganVersion: state.resetCreateVeganVersion,
        }))
    );

    useEffect(() => {
        return () => {
            resetImages();
            recipeState.resetRecipe();
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const { data, loading, error } = useQuery(GET_RECIPE, {
        variables: { filter: { titleIdentifier: originalTitleIdentifier } },
    });
    // Hydrate the recipe store from the query result. This runs as an effect keyed
    // on the route identifier rather than as onCompleted: Apollo does not reliably
    // re-invoke onCompleted when the query variables change, and with cached data it
    // can fire before mount effects, which would let the mount-time reset wipe the
    // hydrated store. The reset lives here for the same reason: it must run
    // immediately before hydration, not race against it.
    useEffect(() => {
        const recipe = data?.recipeOne;
        if (loading || !recipe || hydratedFor === (originalTitleIdentifier ?? '')) {
            return;
        }
        resetImages();
        recipeState.resetRecipe();
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
                index < recipe.ingredientSubsections.length - 1 ||
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
                index < recipe.instructionSubsections.length - 1 ||
                recipe.instructionSubsections.length > 1 ||
                recipe.instructionSubsections[0].name
            ) {
                recipeState.addInstructionSection();
            }
        });
        recipeState.setNotes(recipe.notes ?? '');
        recipeState.setTags(
            recipe.tags.map((tag) => ({
                _id: tag._id,
                value: tag.value,
                key: tag._id,
                isNew: false,
            }))
        );
        recipeState.setSource(recipe.source ?? '');
        if (recipe.isIngredient && recipe.pluralTitle) {
            recipeState.setAsIngredient();
            recipeState.setPluralTitle(recipe.pluralTitle);
        } else {
            recipeState.resetAsIngredient();
        }
        recipeState.resetCreateVeganVersion();
        // Store hydration is complete; images load in below without shifting the
        // content above them, so don't hold up rendering for the fetch.
        setHydratedFor(originalTitleIdentifier ?? '');
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
                    if (e instanceof Error) description = e.message;
                    errorToast({ title: 'Error loading images', description, position: 'top' });
                });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data, loading, originalTitleIdentifier, hydratedFor]);

    const [createRecipe, { loading: recipeLoading, data: createResponse }] = useMutation(
        CREATE_VEGAN_RECIPE,
        {
            update(cache, { data }) {
                const { record } = data?.recipeCreateVeganVersion || {};
                if (!record) return;
                updateRecipeCache(cache, record, true);
                const originalId = record.originalRecipe?._id;
                if (!originalId) return;

                cache.writeFragment({
                    id: `Recipe:${originalId}`,
                    fragment: VEGAN_VERSION_LINK_FRAGMENT,
                    fragmentName: 'VeganVersionLink',
                    data: {
                        veganVersion: {
                            __typename: 'Recipe' as const,
                            _id: record._id,
                            title: record.title,
                            titleIdentifier: record.titleIdentifier,
                        },
                    },
                });
                cache.writeFragment({
                    id: `Recipe:${record._id}`,
                    fragment: VEGAN_ORIGINAL_LINK_FRAGMENT,
                    fragmentName: 'VeganOriginalLink',
                    data: {
                        originalRecipe: { __typename: 'Recipe' as const, _id: originalId },
                    },
                });
                cache.modify({
                    id: `Recipe:${originalId}`,
                    fields: {
                        calculatedTags(existing: string[] | Reference) {
                            const tags = Array.isArray(existing) ? existing : [];
                            if (
                                tags.includes(
                                    formatCalculatedTag(ReservedTags.VeganVersionAvailable)
                                )
                            ) {
                                return tags;
                            }
                            return [
                                ...tags,
                                formatCalculatedTag(ReservedTags.VeganVersionAvailable),
                            ];
                        },
                    },
                });
            },
        }
    );
    const { addRating } = useAddRating();
    const { uploadImages, loading: uploadLoading } = useUploadImages();

    const handleSubmitMutation = async (recipe: CreateOneRecipeCreateInput) => {
        if (!data?.recipeOne) return;
        const originalId = data.recipeOne._id;

        let recipeResult: CompletedRecipeView;
        try {
            const result = await createRecipe({
                variables: { originalId, recipe },
            });
            if (!result.data?.recipeCreateVeganVersion?.record) {
                return errorToast({
                    title: 'Error creating vegan recipe',
                    description: 'No record returned from server',
                    position: 'top',
                });
            }
            recipeResult = result.data.recipeCreateVeganVersion.record;
        } catch (e) {
            let description = 'An error occurred while creating the vegan recipe';
            if (e instanceof Error) description = e.message;
            return errorToast({
                title: 'Error creating vegan recipe',
                description,
                position: 'top',
            });
        }

        try {
            if (rating !== 0) await addRating(rating, recipeResult);
        } catch (e: unknown) {
            let description = 'An error occurred while adding the rating';
            if (e instanceof Error) description = e.message;
            errorToast({
                title: 'Error adding rating, redirecting to home',
                description,
                position: 'top',
            });
            return setTimeout(() => navigate(PATH.ROOT), DELAY_LONG);
        }

        try {
            if (images.length > 0) await uploadImages(images, recipeResult);
        } catch (e: unknown) {
            let description = 'An error occurred while uploading images';
            if (e instanceof Error) description = e.message;
            errorToast({
                title: 'Error uploading images, redirecting to home',
                description,
                position: 'top',
            });
            return setTimeout(() => navigate(PATH.ROOT), DELAY_LONG);
        }

        successToast({
            title: 'Vegan version created',
            description: 'Redirecting you to the home page',
            position: 'top',
        });
        setTimeout(() => navigate(PATH.ROOT), DELAY_SHORT);
    };

    if (error || (!loading && !data?.recipeOne)) return <div>Recipe not found</div>;
    if (loading || !data?.recipeOne || hydratedFor !== (originalTitleIdentifier ?? '')) {
        return <BraisingLoader h='100vh' />;
    }

    return (
        <EditableRecipe
            rating={rating}
            addRating={setRating}
            originalRecipe={data.recipeOne}
            suppressItemInUseError
            submitButton={
                <SubmitButton
                    submitText='Submit Vegan Version'
                    loadingText={
                        recipeLoading
                            ? 'Submitting Recipe...'
                            : uploadLoading
                              ? 'Uploading Images...'
                              : undefined
                    }
                    disabled={!!createResponse}
                    loading={recipeLoading || uploadLoading}
                    handleSubmit={handleSubmitMutation}
                />
            }
        />
    );
}
