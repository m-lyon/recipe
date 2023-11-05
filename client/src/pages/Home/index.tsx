import { WithSubnavigation } from '../../components/Navbar';
import { Container, SimpleGrid } from '@chakra-ui/react';
import { Grid, GridItem, Text } from '@chakra-ui/react';
import { RecipeCard } from './components/RecipeCard';

export function Home() {
    return (
        <>
            <WithSubnavigation />
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
                        <SimpleGrid columns={3} spacing={10}>
                            <RecipeCard />
                            <RecipeCard />
                        </SimpleGrid>
                    </GridItem>
                </Grid>
            </Container>
        </>
    );
}
