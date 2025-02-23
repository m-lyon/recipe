import { Container, Grid, GridItem, Text } from '@chakra-ui/react';

import { useSearchStore } from '@recipe/stores';
import { RecipeCardsContainer } from '@recipe/features/viewing';

export function Home() {
    const showSearch = useSearchStore((state) => state.showSearch);

    return (
        <Container
            maxW='container.xl'
            mt={showSearch ? '120px' : '60px'}
            px='16px'
            transition='margin-top 0.3s'
        >
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
                    <RecipeCardsContainer />
                </GridItem>
            </Grid>
        </Container>
    );
}
