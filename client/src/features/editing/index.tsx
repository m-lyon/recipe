import { useContext } from 'react';
import { Grid, GridItem, useToast } from '@chakra-ui/react';
import { Box, Button, Center, Container } from '@chakra-ui/react';

import { ImageUpload } from './components/ImageUpload';
import { UserContext } from '../../context/UserContext';
import { RecipeState } from './hooks/useRecipeState';
import { EditableTitle } from './components/EditableTitle';
import { StarRatingProps } from '../../components/StarRating';
import { EditableTagList } from './components/EditableTagList';
import { EditableIngredientsTab } from './components/EditableIngredientsTab';
import { EditableInstructionsTab } from './components/EditableInstructionsTab';
import { CreateOneRecipeModifyInput, EnumRecipeIngredientType } from '../../__generated__/graphql';

interface SubmitButtonProps {
    submitText: string;
    loadingText?: string;
    disabled?: boolean;
    isLoading?: boolean;
}
interface Props {
    state: RecipeState;
    rating: StarRatingProps;
    handleSubmitMutation: (recipe: CreateOneRecipeModifyInput) => void;
    submitButtonProps: SubmitButtonProps;
}
export function EditableRecipe(props: Props) {
    const { state, rating, handleSubmitMutation, submitButtonProps } = props;
    const [userContext] = useContext(UserContext);
    const toast = useToast();

    const validate = () => {
        if (state.title.value === null) {
            toast({
                title: 'Please enter a title',
                status: 'error',
                position: 'top',
                duration: 3000,
            });
            return false;
        }
        if (state.ingredient.state.finished.length === 0) {
            toast({
                title: 'Please enter at least one ingredient',
                status: 'error',
                position: 'top',
                duration: 3000,
            });
            return false;
        }
        if (state.instructions.items.length === 0) {
            toast({
                title: 'Please enter at least one instruction',
                status: 'error',
                position: 'top',
                duration: 3000,
            });
            return false;
        }
        if (state.asIngredient.state.isIngredient && !state.asIngredient.state.pluralTitle) {
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

    const handleSubmit = () => {
        if (!validate()) {
            return;
        }
        const tags = state.tags.state.finished.map((tag) => tag._id);
        const instructions = state.instructions.items
            .filter((item) => item.value !== '')
            .map((item) => item.value);
        const ingredients = state.ingredient.state.finished.map((item) => {
            return {
                quantity: item.quantity ? item.quantity : undefined,
                unit: item.unit ? item.unit._id : undefined,
                ingredient: item.ingredient._id,
                prepMethod: item.prepMethod ? item.prepMethod._id : undefined,
                type: item.ingredient.__typename!.toLowerCase() as EnumRecipeIngredientType,
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
        const notes = state.notes.value ? state.notes.value : undefined;
        const source = state.source.source ? state.source.source : undefined;
        const isIngredient = state.asIngredient.state.isIngredient;
        const recipe = {
            numServings: state.numServings.num,
            owner: userContext?._id,
            title: state.title.value!,
            pluralTitle: isIngredient ? state.asIngredient.state.pluralTitle : undefined,
            instructions,
            ingredients,
            tags,
            notes,
            source,
            isIngredient,
        };
        handleSubmitMutation(recipe);
    };

    return (
        <Container maxW='container.xl' pt='60px'>
            <Grid
                templateAreas={`'title title'
                                'ingredients tags'
                                'ingredients instructions'
                                'images images'
                                'button button'`}
                gridTemplateRows='100px 140px auto 300px 90px'
                gridTemplateColumns='0.4fr 1fr'
                h='auto'
                gap='2'
                pt='2'
                pb='2'
                color='blackAlpha.700'
                fontWeight='bold'
            >
                <GridItem pl='2' boxShadow='lg' padding='6' area='title' maxH='100px'>
                    <EditableTitle {...state.title} />
                </GridItem>
                <GridItem
                    pl='2'
                    area='tags'
                    boxShadow='lg'
                    paddingLeft={6}
                    paddingTop={6}
                    paddingRight={6}
                    paddingBottom={2}
                >
                    <EditableTagList {...state.tags} />
                </GridItem>
                <GridItem pl='2' area='ingredients' boxShadow='lg' padding='6'>
                    <EditableIngredientsTab
                        servingsProps={state.numServings}
                        ratingProps={rating}
                        ingredientsProps={state.ingredient}
                        notesProps={state.notes}
                    />
                </GridItem>
                <GridItem pl='2' boxShadow='lg' padding='6' area='instructions' minH='420px'>
                    <EditableInstructionsTab
                        instructionsProps={state.instructions}
                        asIngredientProps={state.asIngredient}
                        sourceProps={state.source}
                    />
                </GridItem>
                <GridItem
                    pl='2'
                    boxShadow='lg'
                    padding='6'
                    area='images'
                    display='flex'
                    flexDirection='column'
                >
                    <ImageUpload {...state.images} />
                </GridItem>
                <GridItem pl='2' padding='6' area='button'>
                    <Center>
                        <Box position='fixed' bottom='4' pb='3'>
                            <Button
                                size='lg'
                                borderRadius='full'
                                border='1px'
                                borderColor='gray.200'
                                onClick={handleSubmit}
                                loadingText={submitButtonProps.loadingText}
                                disabled={submitButtonProps.disabled}
                                isLoading={submitButtonProps.isLoading}
                            >
                                {submitButtonProps.submitText}
                            </Button>
                        </Box>
                    </Center>
                </GridItem>
            </Grid>
        </Container>
    );
}
