import { Container, Box, SkeletonCircle, SkeletonText, Skeleton } from '@chakra-ui/react';
import { Grid, GridItem } from '@chakra-ui/react';
import { VStack } from '@chakra-ui/react';
import { WithSubnavigation } from '../components/Navbar';

export function CreateRecipePage(props) {
    return (
        <>
            <WithSubnavigation />
            <Container maxW='container.xl' pt='60px'>
                <Grid
                    templateAreas={`'header header'
                                    'nav info'
                                    'nav main'
                                    'images images'`}
                    gridTemplateRows={'100px 0.2fr 0.9fr 200px'}
                    gridTemplateColumns={'0.4fr 1fr'}
                    h='1000px'
                    gap='2'
                    pt='2'
                    pb='2'
                    color='blackAlpha.700'
                    fontWeight='bold'
                >
                    <GridItem pl='2' boxShadow='lg' padding='6' area={'header'}>
                        Title Space
                    </GridItem>
                    <GridItem pl='2' area={'info'} boxShadow='lg' padding='6'>
                        <SkeletonText mt='4' noOfLines={3} spacing='3' skeletonHeight='2' />
                    </GridItem>
                    <GridItem pl='2' area={'nav'} boxShadow='lg' padding='6'>
                        <Box>
                            <SkeletonCircle size='10' />
                            <SkeletonText mt='4' noOfLines={5} spacing='4' skeletonHeight='2' />
                        </Box>
                        <Box pt='6'>
                            <SkeletonText mt='4' noOfLines={5} spacing='4' skeletonHeight='2' />
                        </Box>
                        <Box pt='6'>
                            <SkeletonText mt='4' noOfLines={5} spacing='4' skeletonHeight='2' />
                        </Box>
                    </GridItem>
                    <GridItem pl='2' boxShadow='lg' padding='6' area={'main'}>
                        <Box>
                            <SkeletonCircle size='10' />
                            <SkeletonText mt='4' noOfLines={5} spacing='4' skeletonHeight='2' />
                        </Box>
                        <Box pt='6'>
                            <SkeletonText mt='4' noOfLines={5} spacing='4' skeletonHeight='2' />
                        </Box>
                    </GridItem>
                    <GridItem pl='2' boxShadow='lg' padding='6' area={'images'}>
                        Images
                    </GridItem>
                </Grid>
            </Container>
        </>
    );
}
