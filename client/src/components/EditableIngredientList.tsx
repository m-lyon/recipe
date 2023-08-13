import { Box, UnorderedList, VStack, ListItem } from '@chakra-ui/react';
import { EditableIngredient } from './EditableIngredient';
import { useEnterFocus } from '../hooks/useEnterCapture';
import { RefObject } from 'react';
import { useIngredientList, Ingredient } from '../hooks/useIngredientList';

export function EditableIngredientList() {
    const { items, getActionHandler } = useIngredientList();
    const [lastInputRef, handleEnter] = useEnterFocus();

    const ingredientsList = items.map((ingr: Ingredient, index: number) => {
        return (
            <ListItem color={ingr.isEdited ? '' : 'gray.400'} key={index}>
                <EditableIngredient
                    ref={
                        index === items.length - 1
                            ? (lastInputRef as RefObject<HTMLInputElement>)
                            : null
                    }
                    item={ingr}
                    actionHandler={getActionHandler(index)}
                    handleEnter={handleEnter}
                />
            </ListItem>
        );
    });

    return (
        <VStack spacing='24px' align='left'>
            <Box fontSize='2xl'>Ingredients</Box>
            <UnorderedList>{ingredientsList}</UnorderedList>
        </VStack>
    );
}
