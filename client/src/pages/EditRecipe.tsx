import { useToast } from '@chakra-ui/react';
import { useMutation, useQuery } from '@apollo/client';
import { useNavigate, useParams } from 'react-router-dom';

import { useRecipeState } from '@recipe/features/editing';
import { EditableRecipe } from '@recipe/features/editing';
import { GET_RECIPE } from '@recipe/graphql/queries/recipe';
import { useViewStarRating } from '@recipe/features/starRating';
import { GRAPHQL_ENDPOINT, ROOT_PATH } from '@recipe/constants';
import { UPDATE_RECIPE } from '@recipe/graphql/mutations/recipe';
import { dbIngredientToFinished } from '@recipe/features/recipeIngredient';
import { DELETE_IMAGES, UPLOAD_IMAGES } from '@recipe/graphql/mutations/image';
import { RecipeIngredient, UpdateByIdRecipeModifyInput } from '@recipe/graphql/generated';

export function EditRecipe() {
    const toast = useToast();
    const state = useRecipeState();
    const navigate = useNavigate();
    const { titleIdentifier } = useParams();
    const { avgRating: rating, getRatings, setRating } = useViewStarRating();
    const [saveRecipe, { data: response, loading: recipeLoading }] = useMutation(UPDATE_RECIPE, {
        refetchQueries: ['GetRecipe', 'GetRecipes'],
    });
    const [deleteImages] = useMutation(DELETE_IMAGES, {
        refetchQueries: ['GetRecipe', 'GetRecipes'],
    });
    const [uploadImages, { loading: uploadLoading }] = useMutation(UPLOAD_IMAGES, {
        context: { headers: { 'apollo-require-preflight': true } },
        refetchQueries: ['GetRecipe', 'GetRecipes'],
    });
    const { data, loading, error } = useQuery(GET_RECIPE, {
        variables: { filter: { titleIdentifier: titleIdentifier } },
        onCompleted: async (data) => {
            getRatings(data.recipeOne!._id);
            const recipe = data.recipeOne!;
            state.title.actionHandler.set(recipe.title);
            state.numServings.setNum(recipe.numServings);
            const ingredients = recipe.ingredients.map((ing) => {
                return dbIngredientToFinished(ing as RecipeIngredient);
            });
            state.ingredient.actionHandler.setFinishedArray(ingredients);
            state.instructions.actionHandler.setItems(recipe.instructions as string[]);
            if (recipe.notes) {
                state.notes.setNotes(recipe.notes);
            }
            state.tags.setTags(
                data.recipeOne!.tags.map((tag) => {
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
            if (recipe.isIngredient) {
                state.asIngredient.actionHandler.toggleIsIngredient();
                state.asIngredient.actionHandler.setPluralTitle(recipe.pluralTitle!);
            }
            if (recipe.images) {
                try {
                    const images = await Promise.all(
                        recipe.images.map(async (img) => {
                            const res = await fetch(`${GRAPHQL_ENDPOINT}${img!.origUrl}`);
                            const blob = await res.blob();
                            return new File([blob], img!.origUrl, { type: blob.type });
                        })
                    );
                    state.images.setImages(images);
                } catch (error) {
                    toast({
                        title: 'Error loading images',
                        description: (error as Error).message,
                        status: 'error',
                        position: 'top',
                        duration: 3000,
                    });
                }
            }
        },
    });

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error.message}</div>;
    }

    const handleSubmitMutation = async (recipe: UpdateByIdRecipeModifyInput) => {
        try {
            // Save Recipe
            await saveRecipe({ variables: { id: data!.recipeOne!._id, recipe } });
        } catch (error) {
            return toast({
                title: 'Error saving recipe',
                description: (error as Error).message,
                status: 'error',
                position: 'top',
                duration: 3000,
            });
        }
        try {
            // Upload Images
            const originalImages = data!.recipeOne!.images ? data!.recipeOne!.images : [];
            const newImages = state.images.images;
            const imagesToDelete = originalImages.filter(
                (img) => !newImages.map((img) => img.name).includes(img!.origUrl)
            );
            const imagesToAdd = newImages.filter(
                (img) => !originalImages.map((img) => img!.origUrl).includes(img.name)
            );
            if (imagesToDelete.length > 0) {
                await deleteImages({ variables: { ids: imagesToDelete.map((img) => img!._id) } });
            }
            if (imagesToAdd.length > 0) {
                await uploadImages({
                    variables: { recipeId: data!.recipeOne!._id, images: imagesToAdd },
                });
            }
        } catch (error) {
            toast({
                title: 'Error uploading images, redirecting you to the home page',
                description: (error as Error).message,
                status: 'error',
                position: 'top',
                duration: 3000,
            });
            return setTimeout(() => navigate(ROOT_PATH), 3000);
        }
        toast({
            title: 'Recipe saved',
            description: 'Your recipe has been saved, redirecting you to the home page',
            status: 'success',
            position: 'top',
            duration: 1500,
        });

        setTimeout(() => navigate(ROOT_PATH), 1500);
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
