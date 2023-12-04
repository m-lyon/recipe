import { Box, Button, Center, Container } from '@chakra-ui/react';
import { Grid, GridItem } from '@chakra-ui/react';
import { EditableIngredientList } from './components/EditableIngredientList';
import { EditableTitle } from './components/EditableTitle';
import { EditableTagList } from './components/EditableTagList';
import { EditableInstructionList } from './components/EditableIngredientList/components/EditableInstructionList';
import { ImageUpload } from './components/ImageUpload';
import { useRecipeState } from './hooks/useRecipeState';
import { useMutation } from '@apollo/client';
import { EnumRecipeIngredientType, CreateManyTagInput } from '../../__generated__/graphql';
import { gql } from '../../__generated__';
import { useToast } from '@chakra-ui/react';
import { useContext } from 'react';
import { UserContext } from '../../context/UserContext';
import { useNavigate } from 'react-router-dom';

export const CREATE_RECIPE = gql(`
    mutation CreateRecipe($recipe: CreateOneRecipeInput!) {
        recipeCreateOne(record: $recipe) {
            record {
                _id
                title
            }
        }
    }
`);

export const CREATE_TAGS = gql(`
    mutation CreateTags($tags: [CreateManyTagInput!]!) {
        tagCreateMany(records: $tags) {
            records {
                _id
                value
            }
        }
    }
`);

export function CreateRecipe() {
    const { ingredientState, instructionsState, tagsState, titleState } = useRecipeState();
    const userContext = useContext(UserContext)[0];
    const toast = useToast();
    const [createTags, { loading: tagLoading }] = useMutation(CREATE_TAGS);
    const [createRecipe, { loading: recipeLoading }] = useMutation(CREATE_RECIPE);
    const navigate = useNavigate();

    const runDataValidation = () => {
        if (titleState.value === null) {
            toast({
                title: 'Please enter a title',
                status: 'error',
                position: 'top',
                duration: 3000,
                isClosable: true,
            });
            return false;
        }
        if (ingredientState.state.finished.length === 0) {
            toast({
                title: 'Please enter at least one ingredient',
                status: 'error',
                position: 'top',
                duration: 3000,
                isClosable: true,
            });
            return false;
        }
        if (instructionsState.items.length === 0) {
            toast({
                title: 'Please enter at least one instruction',
                status: 'error',
                position: 'top',
                duration: 3000,
                isClosable: true,
            });
            return false;
        }
        return true;
    };

    const handleCreateTags = async (): Promise<string[]> => {
        const newTags = tagsState.state.finished
            .filter((tag) => tag._id === undefined)
            .map((tag) => ({ value: tag.value } as CreateManyTagInput));
        if (newTags.length === 0) {
            return tagsState.state.finished.map((tag) => {
                return tag._id as string;
            });
        } else {
            try {
                const tagData = await createTags({ variables: { tags: newTags } });
                console.log('tagData', tagData);
                return tagsState.state.finished.map((tag) => {
                    if (tag._id !== undefined) {
                        return tag._id;
                    }
                    const newTag = tagData?.data?.tagCreateMany?.records?.find(
                        (newTag) => newTag.value === tag.value
                    );
                    if (!newTag) {
                        throw new Error('No data returned from tag creation');
                    }
                    return newTag._id;
                });
            } catch (error: any) {
                toast({
                    title: 'Error creating tags',
                    description: error.message,
                    status: 'error',
                    position: 'top',
                    duration: 3000,
                    isClosable: true,
                });
                throw error;
            }
        }
    };

    const handleSubmit = async () => {
        if (!runDataValidation()) {
            return;
        }
        let tagIds: string[];
        try {
            tagIds = await handleCreateTags();
            const instructions = instructionsState.items
                .filter((item) => item.isEdited)
                .map((item) => item.value);
            const ingredients = ingredientState.state.finished.map((item) => {
                return {
                    quantity: item.quantity,
                    unit: item.unit._id,
                    ingredient: item.name._id,
                    prepMethod: item.prepMethod._id,
                    type: 'ingredient' as EnumRecipeIngredientType,
                };
            });

            const recipe = {
                owner: userContext?._id,
                title: titleState.value as string,
                instructions,
                ingredients,
                tags: tagIds,
            };
            console.log(recipe);
            createRecipe({ variables: { recipe } })
                .then(() => {
                    toast({
                        title: 'Recipe created',
                        description:
                            'Your recipe has been created, redirecting you to the home page',
                        status: 'success',
                        position: 'top',
                        duration: 1500,
                        isClosable: true,
                    });
                    setTimeout(() => navigate('/'), 1500);
                })
                .catch((error) => {
                    toast({
                        title: 'Error creating recipe',
                        description: error.message,
                        status: 'error',
                        position: 'top',
                        duration: 3000,
                        isClosable: true,
                    });
                });
        } catch (error: any) {
            return;
        }
    };

    let submitText = 'Submit';
    if (recipeLoading) {
        submitText = 'Submitting Recipe...';
    } else if (tagLoading) {
        submitText = 'Submitting Tags...';
    }

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
                    <EditableTitle {...titleState} />
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
                    <EditableTagList {...tagsState} />
                </GridItem>
                <GridItem pl='2' area={'ingredients'} boxShadow='lg' padding='6'>
                    <EditableIngredientList {...ingredientState} />
                </GridItem>
                <GridItem pl='2' boxShadow='lg' padding='6' area={'instructions'}>
                    <EditableInstructionList {...instructionsState} />
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
                                isLoading={recipeLoading || tagLoading}
                            >
                                {submitText}
                            </Button>
                        </Box>
                    </Center>
                </GridItem>
            </Grid>
        </Container>
    );
}
