import { useEffect, useState } from 'react';
import { useShallow } from 'zustand/shallow';
import { useMutation, useQuery } from '@apollo/client';
import { useNavigate, useParams } from 'react-router-dom';

import { useAddRating } from '@recipe/features/rating';
import { useUploadImages } from '@recipe/features/images';
import { GET_RECIPE } from '@recipe/graphql/queries/recipe';
import { useImagesStore, useRecipeStore } from '@recipe/stores';
import { useErrorToast, useSuccessToast } from '@recipe/common/hooks';
import { CreateOneRecipeCreateInput } from '@recipe/graphql/generated';
import { EditableRecipe, updateRecipeCache } from '@recipe/features/editing';
import { DELAY_LONG, DELAY_SHORT, GRAPHQL_URL, PATH } from '@recipe/constants';
import { CREATE_RECIPE, LINK_VEGAN_RECIPE } from '@recipe/graphql/mutations/recipe';

import { queryIngredientToFinished } from './utils';

export function CreateVeganRecipe() {
    const { originalTitleIdentifier } = useParams<{ originalTitleIdentifier: string }>();
    const navigate = useNavigate();
    const errorToast = useErrorToast();
    const successToast = useSuccessToast();
    const [rating, setRating] = useState<number>(0);

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
        resetImages();
        recipeState.resetRecipe();
        return () => {
            resetImages();
            recipeState.resetRecipe();
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const { data, loading, error } = useQuery(GET_RECIPE, {
        variables: { filter: { titleIdentifier: originalTitleIdentifier } },
        onCompleted: async (data) => {
            if (!data.recipeOne) return;
            const recipe = data.recipeOne;
            recipeState.setTitle(recipe.title);
            recipeState.setNumServings(recipe.numServings);
            recipeState.resetIngredients();
            recipe.ingredientSubsections.forEach((sub, index) => {
                recipeState.setIngredientSection(
                    index,
                    sub.ingredients.map((i) => queryIngredientToFinished(i)),
                    sub.name || undefined
                );
            });
            if (recipe.ingredientSubsections.length > 1 || recipe.ingredientSubsections[0].name) {
                recipeState.addIngredientSection();
            }
            recipeState.resetInstructions();
            recipe.instructionSubsections.forEach((sub, index) => {
                recipeState.setInstructionSection(
                    index,
                    [...sub.instructions, ''],
                    sub.name || undefined
                );
            });
            if (recipe.instructionSubsections.length > 1 || recipe.instructionSubsections[0].name) {
                recipeState.addInstructionSection();
            }
            recipeState.setNotes(recipe.notes ?? '');
            recipeState.setTags(
                recipe.tags.map((tag) => ({
                    _id: tag._id,
                    value: tag.value,
                    key: crypto.randomUUID(),
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
            if (recipe.images) {
                try {
                    const fetchedImages = await Promise.all(
                        recipe.images.map(async (img) => {
                            const res = await fetch(`${GRAPHQL_URL}${img.origUrl}`);
                            const blob = await res.blob();
                            return new File([blob], img.origUrl, { type: blob.type });
                        })
                    );
                    setImages(fetchedImages);
                } catch (e: unknown) {
                    let description = 'An error occurred while loading images';
                    if (e instanceof Error) description = e.message;
                    errorToast({ title: 'Error loading images', description, position: 'top' });
                }
            }
        },
    });

    const [createRecipe, { loading: recipeLoading, data: createResponse }] = useMutation(
        CREATE_RECIPE,
        {
            update(cache, { data }) {
                const { record } = data?.recipeCreateOne || {};
                if (!record) return;
                updateRecipeCache(cache, record, true);
            },
        }
    );
    const [linkVeganRecipe] = useMutation(LINK_VEGAN_RECIPE);
    const { addRating } = useAddRating();
    const { uploadImages, loading: uploadLoading } = useUploadImages();

    const handleSubmitMutation = async (recipe: CreateOneRecipeCreateInput) => {
        if (!data?.recipeOne) return;
        const originalId = data.recipeOne._id;

        let recipeResult: CompletedRecipeView;
        try {
            const result = await createRecipe({
                variables: { recipe },
            });
            if (!result.data?.recipeCreateOne?.record) {
                return errorToast({
                    title: 'Error creating vegan recipe',
                    description: 'No record returned from server',
                    position: 'top',
                });
            }
            recipeResult = result.data.recipeCreateOne.record;
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

        try {
            await linkVeganRecipe({
                variables: { originalId, veganId: recipeResult._id },
            });
        } catch (e: unknown) {
            let description = 'An error occurred while linking the vegan version';
            if (e instanceof Error) description = e.message;
            errorToast({ title: 'Error linking vegan recipe', description, position: 'top' });
            return setTimeout(
                () => navigate(`${PATH.ROOT}/edit/recipe/${recipeResult.titleIdentifier}`),
                DELAY_LONG
            );
        }

        successToast({
            title: 'Vegan version created',
            description: 'Redirecting you to edit the vegan version',
            position: 'top',
        });
        setTimeout(
            () => navigate(`${PATH.ROOT}/edit/recipe/${recipeResult.titleIdentifier}`),
            DELAY_SHORT
        );
    };

    if (loading) return <div>Loading...</div>;
    if (error || !data?.recipeOne) return <div>Recipe not found</div>;

    return (
        <EditableRecipe
            rating={rating}
            addRating={setRating}
            handleSubmitMutation={handleSubmitMutation}
            originalRecipe={data.recipeOne}
            submitButtonProps={{
                submitText: 'Submit Vegan Version',
                loadingText: recipeLoading
                    ? 'Submitting Recipe...'
                    : uploadLoading
                      ? 'Uploading Images...'
                      : undefined,
                disabled: !!createResponse,
                loading: recipeLoading || uploadLoading,
            }}
        />
    );
}
