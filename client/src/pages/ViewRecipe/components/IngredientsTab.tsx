import { Text, VStack, Flex, Spacer, HStack } from '@chakra-ui/react';
import { FaStar, FaRegStarHalfStroke, FaRegStar } from 'react-icons/fa6';
import { IconButton } from '@chakra-ui/react';
import { TbWeight } from 'react-icons/tb';
import { CgBowl } from 'react-icons/cg';
import { useState } from 'react';
import { IngredientList } from './IngredientList';
import { Recipe, RecipeIngredient } from '../../../__generated__/graphql';
import { Servings } from '../../../components/Servings';
import { Notes } from './Notes';

interface Props {
    ingredients: RecipeIngredient[];
    notes: Recipe['notes'];
    numServings: Recipe['numServings'];
}
export function IngredientsTab(props: Props) {
    const { ingredients, notes, numServings } = props;
    const [servings, setServings] = useState(numServings);

    return (
        <Flex direction={'column'} justifyContent='space-between' height='100%'>
            <VStack spacing='24px' align='left'>
                <Flex paddingBottom={3}>
                    <Servings num={servings} setNum={setServings} />
                    <Spacer />
                    <HStack spacing={2}>
                        <FaStar />
                        <FaStar />
                        <FaStar />
                        <FaRegStarHalfStroke />
                        <FaRegStar />
                    </HStack>
                </Flex>
                <Flex>
                    <Text fontSize='2xl'>Ingredients</Text>
                    <Spacer />
                    <HStack spacing={2}>
                        <IconButton aria-label={'weight'} icon={<TbWeight />}></IconButton>
                        <IconButton aria-label={'volume'} icon={<CgBowl />}></IconButton>
                    </HStack>
                </Flex>
                <IngredientList ingredients={ingredients} />
            </VStack>
            <Spacer />
            <Notes notes={notes} />
        </Flex>
    );
}
