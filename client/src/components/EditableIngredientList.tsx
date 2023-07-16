import { Box, UnorderedList, VStack } from '@chakra-ui/react';
import { EditableIngredient } from './EditableIngredient';
import { useState, useRef } from 'react';

interface Ingredient {
    text: string;
    isEdited: boolean;
}
export function EditableIngredientList() {
    const [ingredients, setIngredients] = useState<Ingredient[]>([
        { text: 'Enter ingredient', isEdited: false },
    ]);

    const lastInputRef = useRef(null);

    function handleEnter(event: KeyboardEvent) {
        if (event.key === 'Enter' && lastInputRef.current) {
            setTimeout(() => {
                lastInputRef.current.focus();
            }, 0);
        }
    }

    const ingredientsList = ingredients.map((ingredient, index) => (
        <EditableIngredient
            key={index}
            ref={index === ingredients.length - 1 ? lastInputRef : null}
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
            handleEnter={handleEnter}
        />
    ));

    return (
        <VStack spacing='24px' align='left'>
            <Box fontSize='2xl'>Ingredients</Box>
            <UnorderedList>{ingredientsList}</UnorderedList>
        </VStack>
    );
}
