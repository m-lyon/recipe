import { useQuery } from '@apollo/client';
import { useParams } from 'react-router-dom';
import { Box, Container, Flex, Grid, GridItem } from '@chakra-ui/react';

import { useUser } from '@recipe/features/user';
import { GET_RECIPE } from '@recipe/graphql/queries/recipe';
import { ImageViewerRecipe } from '@recipe/features/images';
import { EditRecipeButton, IngredientsTab, InstructionsTab, Title } from '@recipe/features/viewing';

export function ViewRecipe() {
    const { titleIdentifier } = useParams();
    const { data, loading, error } = useQuery(GET_RECIPE, {
        variables: { filter: { titleIdentifier } },
    });
    const { user } = useUser();

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error || !data || !data.recipeOne) {
        return <div>Error: {error?.message}</div>;
    }
    const { title, numServings, isIngredient, pluralTitle } = data.recipeOne;
    const titleNormed =
        isIngredient && pluralTitle ? (numServings > 1 ? pluralTitle : title) : title;
    const hasEditPermission =
        user !== null && (user._id === data.recipeOne.owner || user.role === 'admin');
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
                    <Flex align='center' justify='space-between'>
                        <Title title={titleNormed} />
                        {hasEditPermission && (
                            <EditRecipeButton
                                titleIdentifier={data.recipeOne.titleIdentifier}
                                recipeTitle={titleNormed}
                            />
                        )}
                    </Flex>
                </GridItem>
                <GridItem
                    boxShadow='lg'
                    area='image'
                    w='100%'
                    display={{ base: 'inline', md: 'none' }}
                >
                    <Box position='relative' w='100%'>
                        <ImageViewerRecipe images={data.recipeOne.images} position='relative' />
                    </Box>
                </GridItem>
                <GridItem area='ingredients' boxShadow='lg' p='6'>
                    <IngredientsTab recipe={data.recipeOne} />
                </GridItem>
                <GridItem boxShadow='lg' py='6' pl='6' area='instructions' minH='600px'>
                    <InstructionsTab recipe={data.recipeOne} />
                </GridItem>
            </Grid>
        </Container>
    );
}
