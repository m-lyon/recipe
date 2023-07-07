import { Container, Box, SkeletonCircle, SkeletonText } from '@chakra-ui/react';
import { Grid, GridItem } from '@chakra-ui/react';
import { WithSubnavigation } from '../components/Navbar';
import { EditableTitle } from '../components/EditableTitle';
import { EditableIngredientList } from '../components/EditableIngredientList';
import { EditableField } from '../components/EditableField';

export function CreateRecipePage(props) {
    return (
        <>
            <WithSubnavigation />
            <Container maxW='container.xl' pt='60px'>
                <Grid
                    templateAreas={`'title title'
                                    'ingredients info'
                                    'ingredients main'
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
                    <GridItem pl='2' boxShadow='lg' padding='6' area={'title'}>
                        <EditableField
                            defaultStr='Enter Recipe Title'
                            fontSize='3xl'
                            textAlign='center'
                        />
                    </GridItem>
                    <GridItem pl='2' area={'info'} boxShadow='lg' padding='6'>
                        <SkeletonText mt='4' noOfLines={3} spacing='3' skeletonHeight='2' />
                    </GridItem>
                    <GridItem pl='2' area={'ingredients'} boxShadow='lg' padding='6'>
                        <EditableIngredientList />
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
