import { OrderedList, ListItem } from '@chakra-ui/react';
import { EditableItem } from './EditableItem';
import { useEditableItemList } from '../hooks/useEditableItemList';
import { useEnterFocus } from '../hooks/useEnterCapture';
import { RefObject } from 'react';

export function EditableInstructionList() {
    const defaultStr = 'Enter instructions...';
    const { items, handleAddItem, handleRemoveItem, handleSetValue, handleToggleEdited } =
        useEditableItemList(defaultStr);

    const [lastInputRef, handleEnter] = useEnterFocus();

    const instructionsList = items.map((instr, index) => (
        <ListItem color={instr.isEdited ? '' : 'gray.400'} key={index}>
            <EditableItem
                ref={
                    index === items.length - 1
                        ? (lastInputRef as RefObject<HTMLInputElement>)
                        : null
                }
                defaultStr={defaultStr}
                isLast={index + 1 === items.length}
                item={instr}
                addNewEntry={handleAddItem}
                removeFromList={() => handleRemoveItem(index)}
                setValue={(value: string) => handleSetValue(index, value)}
                toggleIsEdited={() => handleToggleEdited(index)}
                handleEnter={handleEnter}
                fontSize='lg'
            />
        </ListItem>
    ));

    return <OrderedList>{instructionsList}</OrderedList>;
}
