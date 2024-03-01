import { Container } from '@chakra-ui/react';
import { Grid, GridItem, Text } from '@chakra-ui/react';
import { gql } from '../../__generated__';
import { Recipe } from '../../__generated__/graphql';
import { useQuery } from '@apollo/client';
import { RecipeCardContainer } from './components/RecipeCardContainer';

export const GET_RECIPES = gql(`
    query GetRecipes {
        recipeMany {
            titleIdentifier
            title
            tags {
                _id
                value
            }
            isIngredient
            numServings
            pluralTitle
            images {
                origUrl
            }
        }
    }
`);

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
                    <RecipeCardContainer recipes={data!.recipeMany as Recipe[]} />
                </GridItem>
            </Grid>
        </Container>
    );
}
