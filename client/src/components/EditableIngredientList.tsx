import { Box, UnorderedList, VStack, ListItem } from '@chakra-ui/react';
import { EditableItem } from './EditableItem';
import { useEditableItemList } from '../hooks/useEditableItemList';
import { useEnterFocus } from '../hooks/useEnterCapture';

export function EditableIngredientList() {
    const defaultStr = 'Enter ingredient';
    const {
        items: ingredients,
        handleAddItem,
        handleRemoveItem,
        handleSetValue,
        handleToggleEdited,
    } = useEditableItemList(defaultStr);

    const [lastInputRef, handleEnter] = useEnterFocus();

    const ingredientsList = ingredients.map((ingr, index) => (
        <ListItem color={ingr.isEdited ? '' : 'gray.400'} key={index}>
            <EditableItem
                ref={index === ingredients.length - 1 ? lastInputRef : null}
                defaultStr={defaultStr}
                isLast={index + 1 === ingredients.length}
                item={ingr}
                addNewEntry={handleAddItem}
                removeFromList={() => handleRemoveItem(index)}
                setValue={(value: string) => handleSetValue(index, value)}
                toggleIsEdited={() => handleToggleEdited(index)}
                handleEnter={handleEnter}
            />
        </ListItem>
    ));

    return (
        <VStack spacing='24px' align='left'>
            <Box fontSize='2xl'>Ingredients</Box>
            <UnorderedList>{ingredientsList}</UnorderedList>
        </VStack>
    );
}
