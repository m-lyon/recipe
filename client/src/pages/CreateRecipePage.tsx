import { Container, Box, SkeletonCircle, SkeletonText, Skeleton } from '@chakra-ui/react';
import { Grid, GridItem } from '@chakra-ui/react';
import { WithSubnavigation } from '../components/Navbar';

export function CreateRecipePage(props) {
    return (
        <>
            <WithSubnavigation />
            <Container maxW='container.xl'>
                <Grid
                    h='200px'
                    templateRows='repeat(2, 1fr)'
                    templateColumns='repeat(5, 1fr)'
                    gap={4}
                >
                    <GridItem rowSpan={2} colSpan={1} bg='tomato' />
                    <GridItem colSpan={2} bg='papayawhip' />
                    <GridItem colSpan={2} bg='papayawhip' />
                    <GridItem colSpan={4} bg='tomato' />
                </Grid>
            </Container>
            {/* <Container maxW='2xl' centerContent>
                <Box padding='4' boxShadow='lg' bg='white'>
                    <SkeletonCircle size='10' />
                    <SkeletonText mt='4' noOfLines={4} spacing='4' skeletonHeight='2' />
                </Box>
            </Container> */}
        </>
    );
}
