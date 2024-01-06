import { Container } from '@chakra-ui/react';
import { Grid, GridItem } from '@chakra-ui/react';
import { Title } from './components/Title';
import { useQuery } from '@apollo/client';
import { gql } from '../../__generated__';
import { useParams } from 'react-router-dom';
import { IngredientsTab } from './components/IngredientsTab';
import { RecipeIngredient } from '../../__generated__/graphql';
import { InstructionsTab } from './components/InstructionsTab';

export const GET_RECIPE = gql(`
    query GetRecipe($recipeId: MongoID!) {
        recipeById(_id: $recipeId) {
            title
            instructions
            ingredients {
                type
                quantity
                unit {
                    _id
                    shortSingular
                    shortPlural
                    longSingular
                    longPlural
                    preferredNumberFormat
                }
                ingredient {
                    ... on Recipe {
                        _id
                        title
                        pluralTitle
                    }
                    ... on Ingredient {
                    _id
                    name
                    pluralName
                    isCountable
                    }
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
            numServings
            isIngredient
            pluralTitle
            source
            notes
        }
    }
`);

export function ViewRecipe() {
    const { recipeId } = useParams();
    const { data, loading, error } = useQuery(GET_RECIPE, { variables: { recipeId } });

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!recipeId) {
        return <div>Error: Recipe not found</div>;
    }

    if (error) {
        return <div>Error: {error.message}</div>;
    }
    const {
        title,
        instructions,
        ingredients,
        tags,
        notes,
        source,
        numServings,
        isIngredient,
        pluralTitle,
    } = data!.recipeById!;
    const titleNormed = isIngredient ? (numServings > 1 ? pluralTitle : title) : title;

    return (
        <Container maxW='container.xl' pt='60px'>
            <Grid
                templateAreas={`'title title'
                                'ingredients instructions'`}
                gridTemplateRows='100px 700px'
                gridTemplateColumns='0.4fr 1fr'
                h='800px'
                gap='2'
                pt='2'
                pb='2'
                color='blackAlpha.700'
                fontWeight='bold'
            >
                <GridItem pl='2' boxShadow='lg' padding='6' area='title'>
                    <Title title={titleNormed as string} />
                </GridItem>
                <GridItem pl='2' area='ingredients' boxShadow='lg' padding='6'>
                    <IngredientsTab
                        recipeId={recipeId}
                        ingredients={ingredients as RecipeIngredient[]}
                        notes={notes}
                        numServings={numServings}
                    />
                </GridItem>
                <GridItem pl='2' boxShadow='lg' padding='6' area='instructions'>
                    <InstructionsTab tags={tags} instructions={instructions} source={source} />
                </GridItem>
            </Grid>
        </Container>
    );
}
