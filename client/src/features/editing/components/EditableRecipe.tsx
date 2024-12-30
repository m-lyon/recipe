import { Container, Grid, GridItem, useBreakpointValue } from '@chakra-ui/react';

import { useUser } from '@recipe/features/user';
import { Servings } from '@recipe/features/servings';
import { StarRating } from '@recipe/features/rating';
import { ImageUpload } from '@recipe/features/images';
import { IngredientsTabLayout } from '@recipe/layouts';
import { EditableTagList } from '@recipe/features/tags';
import { CreateOneRecipeCreateInput } from '@recipe/graphql/generated';

import { SubmitButton } from './SubmitButton';
import { EditableNotes } from './EditableNotes';
import { EditableTitle } from './EditableTitle';
import { EditableInstructionsTab } from './EditableInstructionsTab';
import { EditableIngredientSubsections } from './EditableIngredientSubsections';

interface SubmitButtonProps {
    submitText: string;
    loadingText?: string;
    disabled?: boolean;
    loading?: boolean;
}
interface Props {
    rating: number;
    addRating: (rating: number) => void;
    handleSubmitMutation: (recipe: CreateOneRecipeCreateInput) => void;
    submitButtonProps: SubmitButtonProps;
}
export function EditableRecipe(props: Props) {
    const { rating, addRating, handleSubmitMutation, submitButtonProps } = props;
    const { isVerified } = useUser();

    const isMobile = useBreakpointValue({ base: true, md: false });

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
                <GridItem
                    boxShadow='lg'
                    padding='6'
                    area='title'
                    minH='100px'
                    alignItems='center'
                    display='flex'
                >
                    <EditableTitle />
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
                    <EditableTagList />
                </GridItem>
                <GridItem
                    area='ingredients'
                    boxShadow='lg'
                    padding='6'
                    minH={{ base: '500px', md: '200px' }}
                >
                    <IngredientsTabLayout
                        Servings={<Servings />}
                        StarRating={
                            <StarRating
                                rating={rating}
                                addRating={addRating}
                                readonly={isMobile || !isVerified}
                                colour='rgba(0, 0, 0, 0.64)'
                            />
                        }
                        IngredientList={<EditableIngredientSubsections />}
                        Notes={<EditableNotes />}
                    />
                </GridItem>
                <GridItem boxShadow='lg' padding='6' area='instructions' minH='420px'>
                    <EditableInstructionsTab />
                </GridItem>
                <GridItem
                    boxShadow='lg'
                    px='6'
                    pt='6'
                    pb='2'
                    area='images'
                    display='flex'
                    flexDirection='column'
                    minH='300px'
                >
                    <ImageUpload />
                </GridItem>
                <GridItem padding='6' area='button'>
                    <SubmitButton
                        {...submitButtonProps}
                        handleSubmit={handleSubmitMutation}
                        isLoggedIn={isVerified}
                    />
                </GridItem>
            </Grid>
        </Container>
    );
}
