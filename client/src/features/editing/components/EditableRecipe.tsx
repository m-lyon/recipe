import { Container, Grid, GridItem, useBreakpointValue } from '@chakra-ui/react';

import { useUser } from '@recipe/features/user';
import { useErrorToast } from '@recipe/common/hooks';
import { Servings } from '@recipe/features/servings';
import { ImageUpload } from '@recipe/features/images';
import { IngredientsTabLayout } from '@recipe/layouts';
import { EditableTagList } from '@recipe/features/tags';
import { StarRating, StarRatingProps } from '@recipe/features/rating';
import { CreateOneRecipeCreateInput } from '@recipe/graphql/generated';

import { SubmitButton } from './SubmitButton';
import { EditableNotes } from './EditableNotes';
import { EditableTitle } from './EditableTitle';
import { RecipeState } from '../hooks/useRecipeState';
import { EditableIngredientList } from './EditableIngredientList';
import { EditableInstructionsTab } from './EditableInstructionsTab';

interface SubmitButtonProps {
    submitText: string;
    loadingText?: string;
    disabled?: boolean;
    loading?: boolean;
}
interface Props {
    state: RecipeState;
    rating: StarRatingProps;
    handleSubmitMutation: (recipe: CreateOneRecipeCreateInput) => void;
    submitButtonProps: SubmitButtonProps;
}
export function EditableRecipe(props: Props) {
    const { state, rating, handleSubmitMutation, submitButtonProps } = props;
    const { isLoggedIn } = useUser();
    const toast = useErrorToast();

    const validate = () => {
        if (state.title.value == null) {
            toast({ title: 'Please enter a title', position: 'top' });
            return false;
        }
        // first ingredient section must have at least one ingredient
        if (state.ingredient.state[0].finished.length === 0) {
            toast({ title: 'Please enter at least one ingredient', position: 'top' });
            return false;
        }
        // first instruction section must have at least one instruction
        if (state.instructions.state[0].instructions.length === 0) {
            toast({ title: 'Please enter at least one instruction', position: 'top' });
            return false;
        }
        const validIngredientSections = state.ingredient.state.filter(
            (section) => section.name || section.finished.length > 0
        );
        const validInstructionSections = state.instructions.state.filter(
            (section) =>
                section.name ||
                section.instructions.filter((line) => line.value.trim() !== '').length > 0
        );
        // if there are two or more non empty sections, they must all have names
        if (
            validIngredientSections.length > 1 &&
            validIngredientSections.some((section) => !section.name || section.name.trim() === '')
        ) {
            toast({ title: 'Please enter a name for each ingredient subsection', position: 'top' });
            return false;
        }
        if (
            validInstructionSections.length > 1 &&
            validInstructionSections.some((section) => !section.name || section.name.trim() === '')
        ) {
            toast({
                title: 'Please enter a name for each instruction subsection',
                position: 'top',
            });
            return false;
        }
        // if there are two or more non empty sections, they must all have at least one ingredient
        if (
            validIngredientSections.length > 1 &&
            validIngredientSections.some((section) => section.finished.length === 0)
        ) {
            toast({
                title: 'Please enter at least one ingredient for each subsection',
                position: 'top',
            });
            return false;
        }
        if (
            validInstructionSections.length > 1 &&
            validInstructionSections.some(
                (section) =>
                    section.instructions.filter((line) => line.value.trim() !== '').length === 0
            )
        ) {
            toast({
                title: 'Please enter at least one instruction for each subsection',
                position: 'top',
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
        const ingredientSubsections = state.ingredient.state
            .filter((section) => section.name || section.finished.length > 0)
            .map((section) => {
                return {
                    name: section.name,
                    ingredients: section.finished.map((item) => {
                        return {
                            quantity: item.quantity ? item.quantity : undefined,
                            unit: item.unit ? item.unit._id : undefined,
                            size: item.size ? item.size._id : undefined,
                            ingredient: item.ingredient._id,
                            prepMethod: item.prepMethod ? item.prepMethod._id : undefined,
                        } satisfies SubmittableRecipeIngredient;
                    }),
                };
            });
        const instructionSubsections = state.instructions.state
            .filter(
                (section) =>
                    section.name ||
                    section.instructions.filter((line) => line.value.trim() !== '').length > 0
            )
            .map((section) => {
                return {
                    name: section.name,
                    instructions: section.instructions
                        .filter((line) => line.value.trim() !== '')
                        .map((line) => line.value),
                };
            });
        if (!isLoggedIn) {
            toast({ title: 'Please log in to create a recipe', position: 'top' });
            return;
        }
        const isIngredient = state.asIngredient.state.isIngredient;
        const recipe = {
            numServings: state.numServings.num,
            // title is not null due to the validation check above
            title: state.title.value!,
            pluralTitle: isIngredient
                ? state.asIngredient.state.pluralTitle
                    ? state.asIngredient.state.pluralTitle
                    : state.title.value
                : undefined,
            instructionSubsections,
            ingredientSubsections,
            tags,
            notes: state.notes.notes ? state.notes.notes : undefined,
            source: state.source.source ? state.source.source : undefined,
            isIngredient,
        };
        handleSubmitMutation(recipe);
    };

    return (
        <Container maxW='container.xl' pt='60px'>
            <Grid
                templateAreas={{
                    base: `'title'
                            'tags' 
                            'ingredients'
                            'instructions'
                            'images'
                            'button'`,
                    md: `'title title'
                            'ingredients tags'
                            'ingredients instructions'
                            'images images'
                            'button button'`,
                }}
                gridTemplateRows={{
                    base: 'auto auto auto auto auto 90px',
                    md: '100px 140px auto auto 90px',
                }}
                gridTemplateColumns={{ base: '100%', md: '0.4fr 1fr' }}
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
                <GridItem
                    area='tags'
                    boxShadow='lg'
                    pl='6'
                    pt='6'
                    pr='6'
                    pb='2'
                    minH={{ base: '134px', md: '140px' }}
                >
                    <EditableTagList {...state.tags} />
                </GridItem>
                <GridItem
                    area='ingredients'
                    boxShadow='lg'
                    padding='6'
                    minH={{ base: '500px', md: '200px' }}
                >
                    <IngredientsTabLayout
                        Servings={<Servings {...state.numServings} />}
                        StarRating={
                            <StarRating
                                {...rating}
                                readonly={
                                    useBreakpointValue({ base: true, md: false }) || !isLoggedIn
                                }
                            />
                        }
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
                    minH='300px'
                >
                    <ImageUpload {...state.images} />
                </GridItem>
                <GridItem padding='6' area='button'>
                    <SubmitButton {...submitButtonProps} handleSubmit={handleSubmit} />
                </GridItem>
            </Grid>
        </Container>
    );
}
