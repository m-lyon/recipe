import { useQuery } from '@apollo/client';
import { Container, Grid, GridItem, Text } from '@chakra-ui/react';

import { Recipe } from '@recipe/graphql/generated';
import { GET_RECIPES } from '@recipe/graphql/queries/recipe';
import { RecipeCardsContainer } from '@recipe/features/viewing';

export function Home() {
    const { data, loading, error, fetchMore } = useQuery(GET_RECIPES, {
        variables: { offset: 0, limit: 10 },
    });

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error.message}</div>;
    }

    return (
        <Container maxW='container.xl' pt='60px' px='16px'>
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
                <GridItem boxShadow='lg' padding='6' area='title'>
                    <Text fontSize='3xl' textAlign='center'>
                        Recipes
                    </Text>
                </GridItem>
                <GridItem boxShadow='lg' area='recipes'>
                    <RecipeCardsContainer
                        recipes={data!.recipeMany as Recipe[]}
                        fetchMore={() => {
                            fetchMore({ variables: { offset: data!.recipeMany.length } });
                        }}
                    />
                </GridItem>
            </Grid>
        </Container>
    );
}
