import { Box, UnorderedList, VStack } from '@chakra-ui/react';
import { EditableIngredient } from './EditableIngredient';
import { useState } from 'react';

export function EditableIngredientList() {
    // Need to figure out a way to handle a state referring to the list of ingredients & then
    // map that to the EditableIngredient component array
    const [ingredients, setIngredients] = useState(['']);

    return (
        <VStack spacing='24px' align='left'>
            <Box fontSize='2xl'>Ingredients</Box>
            <UnorderedList>
                {ingredients.map((ingredient, index) => (
                    <EditableIngredient key={index} setIngredients={setIngredients} />
                ))}
            </UnorderedList>
        </VStack>
    );
}
