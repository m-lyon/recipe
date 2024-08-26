import { useQuery } from '@apollo/client';
import { useParams } from 'react-router-dom';
import { Box, Container, Grid, GridItem, useBreakpointValue } from '@chakra-ui/react';

import { Recipe } from '@recipe/graphql/generated';
import { IngredientSubsection } from '@recipe/types';
import { GET_RECIPE } from '@recipe/graphql/queries/recipe';
import { ImageViewerRecipe } from '@recipe/features/images';
import { IngredientsTab, InstructionsTab, Title } from '@recipe/features/viewing';

export function ViewRecipe() {
    const { titleIdentifier } = useParams();
    const { data, loading, error } = useQuery(GET_RECIPE, {
        variables: { filter: { titleIdentifier } },
    });
    const styles = useBreakpointValue(
        {
            base: {
                templateAreas: `'title'
                            'image'
                            'ingredients'
                            'instructions'`,
                gridTemplateRows: 'repeat(4, auto)',
                gridTemplateColumns: '100%',
                height: 'auto',
                displayImageTab: true,
            },
            md: {
                templateAreas: `'title title'
                            'ingredients instructions'`,
                gridTemplateRows: '100px auto',
                gridTemplateColumns: '0.285fr 0.715fr',
                height: 'auto',
                displayImageTab: false,
            },
        },
        { fallback: 'md' }
    );

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error.message}</div>;
    }
    const {
        title,
        instructionSubsections,
        ingredientSubsections,
        tags,
        calculatedTags,
        notes,
        source,
        numServings,
        isIngredient,
        pluralTitle,
        images,
    } = data!.recipeOne!;
    const titleNormed = isIngredient ? (numServings > 1 ? pluralTitle : title) : title;
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
                <GridItem boxShadow='lg' p='6' area='title'>
                    <Title title={titleNormed as string} />
                </GridItem>
                {styles?.displayImageTab && (
                    <GridItem boxShadow='lg' area='image' w='100%'>
                        <Box position='relative' w='100%'>
                            <ImageViewerRecipe
                                images={images as Recipe['images']}
                                position='relative'
                            />
                        </Box>
                    </GridItem>
                )}
                <GridItem area='ingredients' boxShadow='lg' p='6'>
                    <IngredientsTab
                        recipeId={data!.recipeOne!._id}
                        ingredients={ingredientSubsections as IngredientSubsection[]}
                        notes={notes}
                        numServings={numServings}
                        tags={tags}
                        calculatedTags={calculatedTags}
                    />
                </GridItem>
                <GridItem boxShadow='lg' py='6' pl='6' area='instructions' minH='600px'>
                    <InstructionsTab
                        tags={tags}
                        instructions={instructionSubsections as Recipe['instructionSubsections']}
                        source={source}
                        images={images as Recipe['images']}
                        calculatedTags={calculatedTags}
                    />
                </GridItem>
            </Grid>
        </Container>
    );
}
