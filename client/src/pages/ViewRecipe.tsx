import { useQuery } from '@apollo/client';
import { useParams } from 'react-router-dom';
import { Box, Container, Flex, Grid, GridItem } from '@chakra-ui/react';

import { TagList } from '@recipe/features/tags';
import { GET_RECIPE } from '@recipe/graphql/queries/recipe';
import { ImageViewerRecipe } from '@recipe/features/images';
import { IngredientsTab, InstructionsTab, Timings, Title } from '@recipe/features/viewing';

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
    const recipe = data.recipeOne;
    const { title, numServings, isIngredient, pluralTitle } = recipe;
    const titleNormed =
        isIngredient && pluralTitle ? (numServings > 1 ? pluralTitle : title) : title;
    return (
        <Container maxW='container.xl' pt='60px'>
            <Grid
                templateAreas={{
                    base: `'title'
                            'image'
                            'tags'
                            'ingredients'
                            'instructions'`,
                    md: `'title title'
                            'tags tags'
                            'ingredients instructions'`,
                }}
                gridTemplateRows={{ base: 'repeat(5, auto)', md: '100px auto auto' }}
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
                        <ImageViewerRecipe images={recipe.images} position='relative' />
                    </Box>
                </GridItem>
                <GridItem area='tags' boxShadow='lg' pl='6' pt='6' pr='6' pb='2'>
                    <Flex
                        direction={{ base: 'column', md: 'row' }}
                        gap={4}
                        align={{ base: 'stretch', md: 'flex-start' }}
                    >
                        <Box flex='1'>
                            <TagList
                                tags={recipe.tags
                                    .map((tag) => tag.value)
                                    .concat(recipe.calculatedTags)}
                            />
                        </Box>
                        <Box flexShrink={0}>
                            <Timings
                                activeTime={recipe.activeTime}
                                passiveTime={recipe.passiveTime}
                            />
                        </Box>
                    </Flex>
                </GridItem>
                <GridItem area='ingredients' boxShadow='lg' p='6'>
                    <IngredientsTab recipe={recipe} />
                </GridItem>
                <GridItem boxShadow='lg' py='6' pl='6' area='instructions' minH='600px'>
                    <InstructionsTab recipe={recipe} />
                </GridItem>
            </Grid>
        </Container>
    );
}
