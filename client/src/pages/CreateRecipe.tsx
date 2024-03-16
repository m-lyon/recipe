import { gql } from '../__generated__';
import { useNavigate } from 'react-router-dom';
import { useRecipeState } from '../features/editing/hooks/useRecipeState';
import { EditableRecipe } from '../features/editing';
import { CreateOneRecipeModifyInput } from '../__generated__/graphql';
import { useMutation } from '@apollo/client';
import { ROOT_PATH } from '../constants';
import { useToast } from '@chakra-ui/react';
import { ADD_RATING } from '../graphql/mutations/rating';
import { UPLOAD_IMAGES } from '../graphql/mutations/image';

const CREATE_RECIPE = gql(`
    mutation CreateRecipe($recipe: CreateOneRecipeModifyInput!) {
        recipeCreateOne(record: $recipe) {
            record {
                _id
                title
            }
        }
    }
`);

export function CreateRecipe() {
    const toast = useToast();
    const state = useRecipeState();
    const navigate = useNavigate();
    const [createRecipe, { loading: recipeLoading, data: response }] = useMutation(CREATE_RECIPE);
    const [addRating, { loading: ratingLoading }] = useMutation(ADD_RATING);
    const [uploadImages, { loading: uploadLoading }] = useMutation(UPLOAD_IMAGES, {
        context: { headers: { 'apollo-require-preflight': true } },
    });

    const handleSubmitMutation = async (recipe: CreateOneRecipeModifyInput) => {
        let recipeId: String;
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
                duration: 3000,
            });
        }
        try {
            // Add Rating
            if (state.rating.rating !== 0) {
                await addRating({ variables: { recipeId, rating: state.rating.rating } });
            }
        } catch (error) {
            toast({
                title: 'Error adding rating to recipe, redirecting you to the home page',
                description: (error as Error).message,
                status: 'error',
                position: 'top',
                duration: 3000,
            });
            return setTimeout(() => navigate(ROOT_PATH), 3000);
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
                duration: 3000,
            });
            return setTimeout(() => navigate(ROOT_PATH), 3000);
        }
        toast({
            title: 'Recipe created',
            description: 'Your recipe has been created, redirecting you to the home page',
            status: 'success',
            position: 'top',
            duration: 1500,
        });

        setTimeout(() => navigate(ROOT_PATH), 1500);
    };
    return (
        <EditableRecipe
            state={state}
            handleSubmitMutation={handleSubmitMutation}
            btnSubmitText='Submit'
            btnLoadingText={
                recipeLoading || ratingLoading
                    ? 'Submitting Recipe...'
                    : uploadLoading
                    ? 'Uploading Images...'
                    : undefined
            }
            btnDisabled={!!response}
            btnIsLoading={recipeLoading || ratingLoading || uploadLoading}
        />
    );
}
