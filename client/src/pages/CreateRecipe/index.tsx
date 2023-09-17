import { Box, Button, Center, Container } from '@chakra-ui/react';
import { Grid, GridItem } from '@chakra-ui/react';
import { WithSubnavigation } from '../../components/Navbar';
import { EditableIngredientList } from './components/EditableIngredientList';
import { EditableTitle } from './components/EditableTitle';
import { EditableTagList } from './components/EditableTagList';
import { EditableInstructionList } from './components/EditableInstructionList';
import { ImageUpload } from './components/ImageUpload';
import { useRecipeState } from './hooks/useRecipeState';
import { useMutation } from '@apollo/client';
import { EnumRecipeIngredientsType } from '../../__generated__/graphql';
import { gql } from '../../__generated__';

const CREATE_RECIPE = gql(`
    mutation CreateRecipe($recipe: CreateOneRecipeInput!) {
        recipeCreateOne(record: $recipe) {
            record {
                _id
                title
            }
        }
    }
`);

export function CreateRecipe() {
    const { ingredientState, instructionsState, tagsState, titleState } = useRecipeState();
    const [createRecipe, { data, loading, error }] = useMutation(CREATE_RECIPE);

    const handleSubmit = () => {
        if (titleState.value === null) {
            // Placeholder for proper error handling
            console.log('empty title');
            return;
        }
        const instructions = instructionsState.items
            .filter((item) => item.isEdited)
            .map((item) => item.value);
        const ingredients = ingredientState.state.finished.map((item) => {
            return {
                quantity: item.quantity,
                unit: item.unit._id,
                ingredient: item.name._id,
                prepMethod: item.prepMethod._id,
                type: 'ingredient' as EnumRecipeIngredientsType,
            };
        });
        const tags = tagsState.items.filter((item) => item.isEdited).map((item) => item.value);
        const recipe = {
            owner: import.meta.env.VITE_USER_ID,
            title: titleState.value,
            instructions,
            ingredients,
            tags,
        };
        console.log(recipe);
        createRecipe({ variables: { recipe } });
    };

    return (
        <>
            <WithSubnavigation />
            <Container maxW='container.xl' pt='60px'>
                <Grid
                    templateAreas={`'title title'
                                    'ingredients tags'
                                    'ingredients instructions'
                                    'images images'
                                    'button button'`}
                    gridTemplateRows={'100px 0.2fr 0.9fr 200px 90px'}
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
                    <GridItem pl='2' area={'tags'} boxShadow='lg' padding='6'>
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
                                >
                                    Submit Recipe
                                </Button>
                            </Box>
                        </Center>
                    </GridItem>
                </Grid>
            </Container>
        </>
    );
}
