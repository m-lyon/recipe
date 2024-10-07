import { useQuery } from '@apollo/client';
import { useParams } from 'react-router-dom';
import { Box, Container, Grid, GridItem } from '@chakra-ui/react';

import { GET_RECIPE } from '@recipe/graphql/queries/recipe';
import { ImageViewerRecipe } from '@recipe/features/images';
import { IngredientsTab, InstructionsTab, Title } from '@recipe/features/viewing';

export function ViewRecipe() {
    const { titleIdentifier } = useParams();
    const { data, loading, error } = useQuery(GET_RECIPE, {
        variables: { filter: { titleIdentifier } },
    });

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error || !data || !data.recipeOne) {
        return <div>Error: {error?.message}</div>;
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
    } = data.recipeOne;
    let titleNormed: string;
    if (isIngredient && pluralTitle) {
        titleNormed = numServings > 1 ? pluralTitle : title;
    } else {
        titleNormed = title;
    }
    return (
        <Container maxW='container.xl' pt='60px'>
            <Grid
                templateAreas={{
                    base: `'title'
                            'image'
                            'ingredients'
                            'instructions'`,
                    md: `'title title'
                            'ingredients instructions'`,
                }}
                gridTemplateRows={{ base: 'repeat(4, auto)', md: '100px auto' }}
                gridTemplateColumns={{ base: '100%', md: '0.285fr 0.715fr' }}
                h='auto'
                gap='2'
                pt='2'
                pb='2'
                color='blackAlpha.700'
                fontWeight='bold'
            >
                <GridItem boxShadow='lg' p='6' area='title'>
                    <Title title={titleNormed} />
                </GridItem>
                <GridItem
                    boxShadow='lg'
                    area='image'
                    w='100%'
                    display={{ base: 'inline', md: 'none' }}
                >
                    <Box position='relative' w='100%'>
                        <ImageViewerRecipe images={images} position='relative' />
                    </Box>
                </GridItem>
                <GridItem area='ingredients' boxShadow='lg' p='6'>
                    <IngredientsTab
                        recipeId={data.recipeOne._id}
                        ingredients={ingredientSubsections}
                        notes={notes}
                        numServings={numServings}
                        tags={tags}
                        calculatedTags={calculatedTags}
                    />
                </GridItem>
                <GridItem boxShadow='lg' py='6' pl='6' area='instructions' minH='600px'>
                    <InstructionsTab
                        tags={tags}
                        instructions={instructionSubsections}
                        source={source}
                        images={images}
                        calculatedTags={calculatedTags}
                    />
                </GridItem>
            </Grid>
        </Container>
    );
}
