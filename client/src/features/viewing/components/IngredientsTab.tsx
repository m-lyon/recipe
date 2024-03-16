import { Text, VStack, Flex, Spacer, HStack } from '@chakra-ui/react';
import { IconButton } from '@chakra-ui/react';
import { TbWeight } from 'react-icons/tb';
import { CgBowl } from 'react-icons/cg';
import { useEffect, useState } from 'react';
import { IngredientList } from './IngredientList';
import { Recipe, RecipeIngredient } from '../../../__generated__/graphql';
import { Servings } from '../../../components/Servings';
import { Notes } from './Notes';
import { useViewStarRating } from '../../../hooks/useViewStarRating';
import { StarRating } from '../../../components/StarRating';

interface Props {
    recipeId: string;
    ingredients: RecipeIngredient[];
    notes: Recipe['notes'];
    numServings: Recipe['numServings'];
}
export function IngredientsTab(props: Props) {
    const { recipeId, ingredients, notes, numServings } = props;
    const [servings, setServings] = useState(numServings);
    const { avgRating, getRatings, setRating } = useViewStarRating();

    useEffect(() => {
        getRatings(recipeId);
    }, [recipeId]);

    return (
        <Flex direction='column' justifyContent='space-between' height='100%'>
            <VStack spacing='24px' align='left'>
                <Flex paddingBottom={3}>
                    <Servings num={servings} setNum={setServings} />
                    <Spacer />
                    <StarRating rating={avgRating} setRating={setRating} />
                </Flex>
                <Flex>
                    <Text fontSize='2xl'>Ingredients</Text>
                    <Spacer />
                    <HStack spacing={2}>
                        <IconButton aria-label='weight' icon={<TbWeight />}></IconButton>
                        <IconButton aria-label='volume' icon={<CgBowl />}></IconButton>
                    </HStack>
                </Flex>
                <IngredientList ingredients={ingredients} />
            </VStack>
            <Spacer />
            <Notes notes={notes} />
        </Flex>
    );
}
