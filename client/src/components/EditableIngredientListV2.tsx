import { Box, UnorderedList, VStack } from '@chakra-ui/react';
import { EditableIngredient } from './EditableIngredientV2';
import { useState } from 'react';

interface Ingredient {
    text: string;
    isEdited: boolean;
}

export function EditableIngredientList() {
    // Need to figure out a way to handle a state referring to the list of ingredients & then
    // map that to the EditableIngredient component array
    // const [ingredients, setIngredients] = useState(['Enter ingredient']);
    const [ingredients, setIngredients] = useState<Ingredient[]>([
        { text: 'Enter ingredient', isEdited: false },
    ]);

    const ingredientsList = ingredients.map((ingredient, index) => (
        <EditableIngredient
            key={index}
            isLast={index + 1 === ingredients.length}
            removeFromList={() =>
                setIngredients((prevIngredients: Ingredient[]) => {
                    return prevIngredients.filter((value, idx) => {
                        return index !== idx;
                    });
                })
            }
            inputValue={ingredient.text}
            isEdited={ingredient.isEdited}
            setValue={(newText: string) => {
                setIngredients((prevIngredients: Ingredient[]) => {
                    return prevIngredients.map((oldValue, idx) => {
                        if (idx !== index) {
                            return oldValue;
                        } else {
                            return { ...oldValue, text: newText };
                        }
                    });
                });
            }}
            addNewEntry={() => {
                setIngredients((prevIngredients) => {
                    return prevIngredients.concat([{ text: 'Enter ingredient', isEdited: false }]);
                });
            }}
            toggleIsEdited={() => {
                setIngredients((prevIngredients: Ingredient[]) => {
                    return prevIngredients.map((oldValue, idx) => {
                        if (idx !== index) {
                            return oldValue;
                        } else {
                            return { text: oldValue.text, isEdited: !oldValue.isEdited };
                        }
                    });
                });
            }}
        />
    ));

    return (
        <VStack spacing='24px' align='left'>
            <Box fontSize='2xl'>Ingredients</Box>
            <UnorderedList>{ingredientsList}</UnorderedList>
        </VStack>
    );
}
