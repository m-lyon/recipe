import { useContext } from 'react';
import { Box, Button, Center, Container, Grid, GridItem, useToast } from '@chakra-ui/react';

import { CreateOneRecipeModifyInput, EnumRecipeIngredientType } from '../../__generated__/graphql';
import { StarRating, StarRatingProps } from '../../components/StarRating';
import { EditableIngredientList } from './components/EditableIngredientList';
import { EditableInstructionsTab } from './components/EditableInstructionsTab';
import { EditableNotes } from './components/EditableNotes';
import { EditableTagList } from './components/EditableTagList';
import { EditableTitle } from './components/EditableTitle';
import { ImageUpload } from './components/ImageUpload';
import { IngredientsTabLayout } from '../../layouts/IngredientsTabLayout';
import { RecipeState } from './hooks/useRecipeState';
import { Servings } from '../../components/Servings';
import { UserContext } from '../../context/UserContext';

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
                <GridItem boxShadow='lg' padding='6' area='title' maxH='100px'>
                    <EditableTitle {...state.title} />
                </GridItem>
                <GridItem area='tags' boxShadow='lg' pl='6' pt='6' pr='6' pb='2'>
                    <EditableTagList {...state.tags} />
                </GridItem>
                <GridItem area='ingredients' boxShadow='lg' padding='6'>
                    <IngredientsTabLayout
                        Servings={<Servings {...state.numServings} />}
                        StarRating={<StarRating {...rating} />}
                        IngredientList={<EditableIngredientList {...state.ingredient} />}
                        Notes={<EditableNotes {...state.notes} />}
                    />
                </GridItem>
                <GridItem boxShadow='lg' padding='6' area='instructions' minH='420px'>
                    <EditableInstructionsTab
                        instructionsProps={state.instructions}
                        asIngredientProps={state.asIngredient}
                        sourceProps={state.source}
                    />
                </GridItem>
                <GridItem
                    boxShadow='lg'
                    padding='6'
                    area='images'
                    display='flex'
                    flexDirection='column'
                >
                    <ImageUpload {...state.images} />
                </GridItem>
                <GridItem padding='6' area='button'>
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
