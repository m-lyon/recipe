import { Container, Wrap } from '@chakra-ui/react';
import { Grid, GridItem, Text } from '@chakra-ui/react';
import { RecipeCard } from './components/RecipeCard';
import { gql } from '../../__generated__';
import { useQuery } from '@apollo/client';

export const GET_RECIPES = gql(`
    query GetRecipes {
        recipeMany {
            _id
            title
            tags {
                _id
                value
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

    const recipeCards = data?.recipeMany.map((recipe) => {
        return (
            <RecipeCard
                recipeId={recipe._id}
                title={recipe.title}
                tags={recipe.tags}
                key={recipe._id}
            />
        );
    });

    return (
        <Container maxW='container.xl' pt='60px'>
            <Grid
                templateAreas={`'title'
                                    'recipes'`}
                gridTemplateRows={'100px 0.8fr'}
                gridTemplateColumns={'1fr'}
                h='1000px'
                gap='2'
                pt='2'
                pb='2'
                color='blackAlpha.700'
                fontWeight='bold'
            >
                <GridItem pl='2' boxShadow='lg' padding='6' area={'title'}>
                    <Text fontSize={'3xl'} textAlign={'center'}>
                        Recipes
                    </Text>
                </GridItem>
                <GridItem pl='2' area={'recipes'} boxShadow='lg' padding='6'>
                    <Wrap spacing='30px'>{recipeCards}</Wrap>
                </GridItem>
            </Grid>
        </Container>
    );
}
