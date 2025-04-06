import { Container, Grid, GridItem, Text, useBreakpointValue } from '@chakra-ui/react';

import { useSelectedFilters } from '@recipe/features/search';
import { RecipeCardsContainer } from '@recipe/features/viewing';
import { SELECTED_FILTERS_HEIGHT } from '@recipe/features/navbar';
import { NAV_HEIGHT, SEARCH_FILTER_MOBILE_HEIGHT } from '@recipe/features/navbar';

export function Home() {
    const { showSearch, showSelected } = useSelectedFilters();
    const isMobile = useBreakpointValue({ base: true, md: false });
    return (
        <Container
            maxW='container.xl'
            pt={
                showSearch
                    ? isMobile
                        ? showSelected
                            ? `${NAV_HEIGHT + SEARCH_FILTER_MOBILE_HEIGHT + SELECTED_FILTERS_HEIGHT}px`
                            : `${NAV_HEIGHT + SEARCH_FILTER_MOBILE_HEIGHT}px`
                        : showSelected
                          ? `${NAV_HEIGHT * 2 + SELECTED_FILTERS_HEIGHT}px`
                          : `${NAV_HEIGHT * 2}px`
                    : `${NAV_HEIGHT}px`
            }
            px='16px'
            transition='padding-top 0.3s'
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
