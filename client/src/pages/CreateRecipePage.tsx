import { Container } from '@chakra-ui/react';
import { Grid, GridItem } from '@chakra-ui/react';
import { WithSubnavigation } from '../components/Navbar';
import { EditableIngredientList } from '../components/EditableIngredientList';
import { EditableField } from '../components/EditableField';
import { EditableTagList } from '../components/EditableTagList';
import { EditableInstructionList } from '../components/EditableInstructionList';
import { ImageUpload } from '../components/ImageUpload';

export function CreateRecipePage() {
    return (
        <>
            <WithSubnavigation />
            <Container maxW='container.xl' pt='60px'>
                <Grid
                    templateAreas={`'title title'
                                    'ingredients tags'
                                    'ingredients instructions'
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
                    <GridItem pl='2' area={'tags'} boxShadow='lg' padding='6'>
                        <EditableTagList />
                    </GridItem>
                    <GridItem pl='2' area={'ingredients'} boxShadow='lg' padding='6'>
                        <EditableIngredientList />
                    </GridItem>
                    <GridItem pl='2' boxShadow='lg' padding='6' area={'instructions'}>
                        <EditableInstructionList />
                    </GridItem>
                    <GridItem pl='2' boxShadow='lg' padding='6' area={'images'}>
                        <ImageUpload />
                    </GridItem>
                </Grid>
            </Container>
        </>
    );
}
