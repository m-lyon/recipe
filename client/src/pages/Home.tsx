import { useQuery } from '@apollo/client';
import { Container, Grid, GridItem, Text } from '@chakra-ui/react';

import { Recipe } from '../__generated__/graphql';
import { GET_RECIPES } from '../graphql/queries/recipe';
import { RecipeCardsContainer } from '../features/viewing/components/RecipeCardsContainer';

export function Home() {
    const { data, loading, error } = useQuery(GET_RECIPES);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error.message}</div>;
    }

    return (
        <Container maxW='container.xl' pt='60px'>
            <Grid
                templateAreas={`'title'
                                'recipes'`}
                gridTemplateRows='100px 0.8fr'
                gridTemplateColumns='1fr'
                h='1000px'
                gap='2'
                pt='2'
                pb='2'
                color='blackAlpha.700'
                fontWeight='bold'
            >
                <GridItem pl='2' boxShadow='lg' padding='6' area='title'>
                    <Text fontSize='3xl' textAlign='center'>
                        Recipes
                    </Text>
                </GridItem>
                <GridItem pl='2' boxShadow='lg' padding='6' area='recipes'>
                    <RecipeCardsContainer recipes={data!.recipeMany as Recipe[]} />
                </GridItem>
            </Grid>
        </Container>
    );
}
