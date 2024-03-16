import { Container } from '@chakra-ui/react';
import { Grid, GridItem } from '@chakra-ui/react';
import { Title } from '../features/viewing/components/Title';
import { useQuery } from '@apollo/client';
import { GET_RECIPE } from '../graphql/queries/recipe';
import { useParams } from 'react-router-dom';
import { IngredientsTab } from '../features/viewing/components/IngredientsTab';
import { Recipe, RecipeIngredient } from '../__generated__/graphql';
import { InstructionsTab } from '../features/viewing/components/InstructionsTab';

export function ViewRecipe() {
    const { titleIdentifier } = useParams();
    const { data, loading, error } = useQuery(GET_RECIPE, {
        variables: { filter: { titleIdentifier } },
    });

    if (loading) {
        return <div>Loading...</div>;
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
        images,
    } = data!.recipeOne!;
    const titleNormed = isIngredient ? (numServings > 1 ? pluralTitle : title) : title;

    return (
        <Container maxW='container.xl' pt='60px'>
            <Grid
                templateAreas={`'title title'
                                'ingredients instructions'`}
                gridTemplateRows='100px 700px'
                gridTemplateColumns='0.285fr 0.715fr'
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
                        recipeId={data!.recipeOne!._id}
                        ingredients={ingredients as RecipeIngredient[]}
                        notes={notes}
                        numServings={numServings}
                    />
                </GridItem>
                <GridItem pl='2' boxShadow='lg' padding='6' area='instructions'>
                    <InstructionsTab
                        tags={tags}
                        instructions={instructions}
                        source={source}
                        images={images as Recipe['images']}
                    />
                </GridItem>
            </Grid>
        </Container>
    );
}
