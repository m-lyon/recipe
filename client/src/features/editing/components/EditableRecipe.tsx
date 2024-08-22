import { useContext } from 'react';
import { Container, Grid, GridItem, useBreakpointValue } from '@chakra-ui/react';

import { UserContext } from '@recipe/features/user';
import { useErrorToast } from '@recipe/common/hooks';
import { Servings } from '@recipe/features/servings';
import { ImageUpload } from '@recipe/features/images';
import { IngredientsTabLayout } from '@recipe/layouts';
import { EditableTagList } from '@recipe/features/tags';
import { EditableField } from '@recipe/common/components';
import { EnumRecipeIngredientType } from '@recipe/graphql/generated';
import { StarRating, StarRatingProps } from '@recipe/features/rating';
import { CreateOneRecipeCreateInput } from '@recipe/graphql/generated';

import { SubmitButton } from './SubmitButton';
import { EditableNotes } from './EditableNotes';
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
    const [userContext] = useContext(UserContext);
    const toast = useErrorToast();
    const styles = useBreakpointValue(
        {
            base: {
                templateAreas: `'title'
                            'tags' 
                            'ingredients'
                            'instructions'
                            'images'
                            'button'`,
                gridTemplateRows: 'auto auto auto auto auto 90px',
                gridTemplateColumns: '100%',
                height: 'auto',
                tagMinHeight: '134px',
                ingredientsMinHeight: '500px',
                imageMinHeight: '300px',
                readonlyStarRating: true,
            },
            md: {
                templateAreas: `'title title'
                            'ingredients tags'
                            'ingredients instructions'
                            'images images'
                            'button button'`,
                gridTemplateRows: '100px 140px auto auto 90px',
                gridTemplateColumns: '0.4fr 1fr',
                height: 'auto',
                tagMinHeight: '140px',
                ingredientsMinHeight: '200px',
                imageMinHeight: '300px',
                readonlyStarRating: false,
            },
        },
        { fallback: 'md' }
    );

    const validate = () => {
        if (state.title.value === null) {
            toast({ title: 'Please enter a title', position: 'top' });
            return false;
        }
        if (state.ingredient.state[0].finished.length === 0) {
            toast({ title: 'Please enter at least one ingredient', position: 'top' });
            return false;
        }
        if (state.instructions.items.length === 0) {
            toast({ title: 'Please enter at least one instruction', position: 'top' });
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
        const ingredientSubsections = state.ingredient.state
            .filter((section) => section.name || section.finished.length > 0)
            .map((section) => {
                return {
                    name: section.name,
                    ingredients: section.finished.map((item) => {
                        return {
                            quantity: item.quantity ? item.quantity : undefined,
                            unit: item.unit ? item.unit._id : undefined,
                            ingredient: item.ingredient._id,
                            prepMethod: item.prepMethod ? item.prepMethod._id : undefined,
                            type: EnumRecipeIngredientType[item.ingredient.__typename!],
                        };
                    }),
                };
            });
        if (userContext === false) {
            toast({ title: 'Please log in to create a recipe', position: 'top' });
            return;
        }
        const isIngredient = state.asIngredient.state.isIngredient;
        const recipe = {
            numServings: state.numServings.num,
            title: state.title.value!,
            pluralTitle: isIngredient
                ? state.asIngredient.state.pluralTitle
                    ? state.asIngredient.state.pluralTitle
                    : state.title.value
                : undefined,
            instructions,
            ingredientSubsections,
            tags,
            notes: state.notes.notes ? state.notes.notes : undefined,
            source: state.source.source ? state.source.source : undefined,
            isIngredient,
        };
        handleSubmitMutation(recipe);
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { value: titleValue, ...titleState } = state.title;

    return (
        <Container maxW='container.xl' pt='60px'>
            <Grid
                templateAreas={styles!.templateAreas}
                gridTemplateRows={styles!.gridTemplateRows}
                gridTemplateColumns={styles!.gridTemplateColumns}
                h={styles!.height}
                gap='2'
                pt='2'
                pb='2'
                color='blackAlpha.700'
                fontWeight='bold'
            >
                <GridItem boxShadow='lg' padding='6' area='title' maxH='100px'>
                    <EditableField
                        {...titleState}
                        fontSize='3xl'
                        textAlign='center'
                        ariaLabel='Edit recipe title'
                    />
                </GridItem>
                <GridItem
                    area='tags'
                    boxShadow='lg'
                    pl='6'
                    pt='6'
                    pr='6'
                    pb='2'
                    minH={styles?.tagMinHeight}
                >
                    <EditableTagList {...state.tags} />
                </GridItem>
                <GridItem
                    area='ingredients'
                    boxShadow='lg'
                    padding='6'
                    minH={styles?.ingredientsMinHeight}
                >
                    <IngredientsTabLayout
                        Servings={<Servings {...state.numServings} />}
                        StarRating={
                            <StarRating
                                {...rating}
                                readonly={styles?.readonlyStarRating || !userContext}
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
                    minH={styles?.imageMinHeight}
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
