import { Container } from '@chakra-ui/react';
import { Grid, GridItem } from '@chakra-ui/react';
import { IngredientList } from './components/IngredientList';
import { Title } from './components/Title';
import { TagList } from './components/TagList';
import { InstructionList } from './components/InstructionList';
import { ImageDisplay } from './components/ImageDisplay';
import { useQuery } from '@apollo/client';
import { gql } from '../../__generated__';
import { useParams } from 'react-router-dom';

export const GET_RECIPE = gql(`
    query GetRecipe($recipeId: MongoID!) {
        recipeById(_id: $recipeId) {
            title
            instructions
            ingredients {
                quantity
                unit {
                    _id
                    shortSingular
                    shortPlural
                }
                ingredient {
                    _id
                    name
                    pluralName
                    isCountable
                }
                prepMethod {
                    _id
                    value
                }
            }
            tags {
                _id
                value
            }
        }
    }
`);

export function ViewRecipe() {
    const { recipeId } = useParams();
    const { data, loading, error } = useQuery(GET_RECIPE, { variables: { recipeId } });

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error.message}</div>;
    }
    const { title, instructions, ingredients, tags } = data!.recipeById!;

    return (
        <Container maxW='container.xl' pt='60px'>
            <Grid
                templateAreas={`'title title'
                                    'ingredients tags'
                                    'ingredients instructions'
                                    'images images'`}
                gridTemplateRows={'100px 0.3fr 0.9fr 200px'}
                gridTemplateColumns={'0.4fr 1fr'}
                h='1000px'
                gap='2'
                pt='2'
                pb='2'
                color='blackAlpha.700'
                fontWeight='bold'
            >
                <GridItem pl='2' boxShadow='lg' padding='6' area={'title'}>
                    <Title title={title} />
                </GridItem>
                <GridItem
                    pl='2'
                    area={'tags'}
                    boxShadow='lg'
                    paddingLeft={6}
                    paddingTop={6}
                    paddingRight={6}
                    paddingBottom={2}
                >
                    <TagList tags={tags} />
                </GridItem>
                <GridItem pl='2' area={'ingredients'} boxShadow='lg' padding='6'>
                    <IngredientList ingredients={ingredients} />
                </GridItem>
                <GridItem pl='2' boxShadow='lg' padding='6' area={'instructions'}>
                    <InstructionList instructions={instructions} />
                </GridItem>
                <GridItem pl='2' boxShadow='lg' padding='6' area={'images'}>
                    <ImageDisplay />
                </GridItem>
            </Grid>
        </Container>
    );
}
