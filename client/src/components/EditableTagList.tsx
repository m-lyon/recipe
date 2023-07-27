import { Wrap, WrapItem } from '@chakra-ui/react';
import { useEditableItemList } from '../hooks/useEditableItemList';
import { useEnterFocus } from '../hooks/useEnterCapture';
import { EditableItem } from './EditableItem';
import { RefObject } from 'react';

export function EditableTagList() {
    const defaultStr = 'Add a tag...';
    const { items, handleAddItem, handleRemoveItem, handleSetValue, handleToggleEdited } =
        useEditableItemList(defaultStr);
    const [lastInputRef, handleEnter] = useEnterFocus();

    const tagsList = items.map((tag, index) => {
        return (
            <WrapItem color={tag.isEdited ? '' : 'gray.400'} key={index}>
                <EditableItem
                    ref={
                        index === items.length - 1
                            ? (lastInputRef as RefObject<HTMLInputElement>)
                            : null
                    }
                    defaultStr={defaultStr}
                    isLast={index + 1 === items.length}
                    item={tag}
                    addNewEntry={handleAddItem}
                    removeFromList={() => handleRemoveItem(index)}
                    setValue={(value: string) => handleSetValue(index, value)}
                    toggleIsEdited={() => handleToggleEdited(index)}
                    handleEnter={handleEnter}
                />
            </WrapItem>
        );
    });
    return <Wrap spacing='25px'>{tagsList}</Wrap>;
}
