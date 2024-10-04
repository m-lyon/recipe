import { useQuery } from '@apollo/client';
import { Container, Grid, GridItem, Text } from '@chakra-ui/react';

import { useSearchQuery } from '@recipe/features/navbar';
import { GET_RECIPES } from '@recipe/graphql/queries/recipe';
import { RecipeCardsContainer } from '@recipe/features/viewing';
import { FETCH_MORE_NUM, INIT_LOAD_NUM } from '@recipe/constants';

export function Home() {
    const { searchQuery } = useSearchQuery();
    const { data, loading, error, fetchMore } = useQuery(GET_RECIPES, {
        variables: { offset: 0, limit: INIT_LOAD_NUM },
    });

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error || !data) {
        return <div>Error: {error?.message}</div>;
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
                        recipes={data.recipeMany}
                        fetchMore={() => {
                            fetchMore({
                                variables: {
                                    offset: data!.recipeMany.length,
                                    limit: FETCH_MORE_NUM,
                                    filter: searchQuery
                                        ? { _operators: { title: { regex: `/${searchQuery}/i` } } }
                                        : undefined,
                                },
                            });
                        }}
                        searchQuery={searchQuery}
                    />
                </GridItem>
            </Grid>
        </Container>
    );
}
