import { Box, Button, Center, Container } from '@chakra-ui/react';
import { Grid, GridItem, useToast } from '@chakra-ui/react';
import { EditableTitle } from './components/EditableTitle';
import { EditableTagList } from './components/EditableTagList';
import { ImageUpload } from './components/ImageUpload';
import { useRecipeState } from './hooks/useRecipeState';
import { useMutation } from '@apollo/client';
import { gql } from '../../__generated__';
import { useContext } from 'react';
import { UserContext } from '../../context/UserContext';
import { useNavigate } from 'react-router-dom';
import { EditableIngredientsTab } from './components/EditableIngredientsTab';
import { EditableInstructionsTab } from './components/EditableInstructionsTab';

export const CREATE_RECIPE = gql(`
    mutation CreateRecipe($recipe: CreateOneRecipeModifyInput!) {
        recipeCreateOne(record: $recipe) {
            record {
                _id
                title
            }
        }
    }
`);

export const AddRating = gql(`
    mutation AddRating($recipeId: MongoID!, $rating: Float!) {
        ratingCreateOne(record: { recipe: $recipeId, value: $rating }) {
            record {
                _id
                value
            }
        }
    }
`);

export function CreateRecipe() {
    const states = useRecipeState();
    const userContext = useContext(UserContext)[0];
    const toast = useToast();
    const [createRecipe, { loading: recipeLoading }] = useMutation(CREATE_RECIPE);
    const [addRating, { loading: ratingLoading }] = useMutation(AddRating);
    const navigate = useNavigate();

    const runDataValidation = () => {
        if (states.title.value === null) {
            toast({
                title: 'Please enter a title',
                status: 'error',
                position: 'top',
                duration: 3000,
            });
            return false;
        }
        if (states.ingredient.state.finished.length === 0) {
            toast({
                title: 'Please enter at least one ingredient',
                status: 'error',
                position: 'top',
                duration: 3000,
            });
            return false;
        }
        if (states.instructions.items.length === 0) {
            toast({
                title: 'Please enter at least one instruction',
                status: 'error',
                position: 'top',
                duration: 3000,
            });
            return false;
        }
        if (states.asIngredient.state.isIngredient && !states.asIngredient.state.pluralTitle) {
            toast({
                title: 'Please enter a plural title',
                status: 'error',
                position: 'top',
                duration: 3000,
            });
            return false;
        }
        return true;
    };

    const handleRecipeCreated = () => {
        toast({
            title: 'Recipe created',
            description: 'Your recipe has been created, redirecting you to the home page',
            status: 'success',
            position: 'top',
            duration: 1500,
        });
        setTimeout(() => navigate('/recipe'), 1500);
    };

    const handleSubmit = async () => {
        if (!runDataValidation()) {
            return;
        }
        try {
            const tags = states.tags.state.finished.map((tag) => tag._id);
            const instructions = states.instructions.items
                .filter((item) => item.value !== '')
                .map((item) => item.value);
            const ingredients = states.ingredient.state.finished.map((item) => {
                return {
                    quantity: item.quantity,
                    unit: item.unit._id,
                    ingredient: item.name._id,
                    prepMethod: item.prepMethod._id,
                    type: item.type,
                };
            });
            if (userContext === false) {
                toast({
                    title: 'Please log in to create a recipe',
                    status: 'error',
                    position: 'top',
                    duration: 3000,
                });
                return;
            }
            const notes = states.notes.value ? states.notes.value : undefined;
            const source = states.source.source ? states.source.source : undefined;
            const isIngredient = states.asIngredient.state.isIngredient;
            const recipe = {
                numServings: states.numServings.num,
                owner: userContext?._id,
                title: states.title.value!,
                pluralTitle: isIngredient ? states.asIngredient.state.pluralTitle : undefined,
                instructions,
                ingredients,
                tags,
                notes,
                source,
                isIngredient,
            };
            createRecipe({ variables: { recipe } })
                .then((result) => {
                    if (states.rating.rating !== 0) {
                        addRating({
                            variables: {
                                recipeId: result.data?.recipeCreateOne?.record?._id,
                                rating: states.rating.rating,
                            },
                        })
                            .then(handleRecipeCreated)
                            .catch((error) => {
                                toast({
                                    title: 'Error adding rating to recipe, redirecting you to the home page',
                                    description: error.message,
                                    status: 'error',
                                    position: 'top',
                                    duration: 3000,
                                });
                                setTimeout(() => navigate('/recipe'), 3000);
                            });
                    } else {
                        handleRecipeCreated();
                    }
                })
                .catch((error) => {
                    toast({
                        title: 'Error creating recipe',
                        description: error.message,
                        status: 'error',
                        position: 'top',
                        duration: 3000,
                    });
                });
        } catch (error: any) {
            return;
        }
    };

    return (
        <Container maxW='container.xl' pt='60px'>
            <Grid
                templateAreas={`'title title'
                                    'ingredients tags'
                                    'ingredients instructions'
                                    'images images'
                                    'button button'`}
                gridTemplateRows={'100px 0.3fr 0.9fr 200px 90px'}
                gridTemplateColumns={'0.4fr 1fr'}
                h='1000px'
                gap='2'
                pt='2'
                pb='2'
                color='blackAlpha.700'
                fontWeight='bold'
            >
                <GridItem pl='2' boxShadow='lg' padding='6' area={'title'}>
                    <EditableTitle {...states.title} />
                </GridItem>
                <GridItem
                    pl='2'
                    area={'tags'}
                    boxShadow='lg'
                    paddingLeft={6}
                    paddingTop={6}
                    paddingRight={6}
                    paddingBottom={2}
                >
                    <EditableTagList {...states.tags} />
                </GridItem>
                <GridItem pl='2' area={'ingredients'} boxShadow='lg' padding='6'>
                    <EditableIngredientsTab
                        servingsProps={states.numServings}
                        ratingProps={states.rating}
                        ingredientsProps={states.ingredient}
                        notesProps={states.notes}
                    />
                </GridItem>
                <GridItem pl='2' boxShadow='lg' padding='6' area={'instructions'}>
                    <EditableInstructionsTab
                        instructionsProps={states.instructions}
                        asIngredientProps={states.asIngredient}
                        sourceProps={states.source}
                    />
                </GridItem>
                <GridItem pl='2' boxShadow='lg' padding='6' area={'images'}>
                    <ImageUpload />
                </GridItem>
                <GridItem pl='2' padding='6' area={'button'}>
                    <Center>
                        <Box position='fixed' bottom='4' pb='3'>
                            <Button
                                size='lg'
                                borderRadius='full'
                                border='1px'
                                borderColor='gray.200'
                                onClick={handleSubmit}
                                isLoading={recipeLoading || ratingLoading}
                            >
                                {recipeLoading || ratingLoading ? 'Submitting Recipe...' : 'Submit'}
                            </Button>
                        </Box>
                    </Center>
                </GridItem>
            </Grid>
        </Container>
    );
}
