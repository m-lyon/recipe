import { Tag, TagCloseButton, TagLabel, VStack, Wrap, WrapItem } from '@chakra-ui/react';
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
        if (index !== items.length - 1) {
            return (
                <WrapItem>
                    <Tag>
                        <TagLabel>{tag.value}</TagLabel>
                        <TagCloseButton onClick={() => handleRemoveItem(index)} />
                    </Tag>
                </WrapItem>
            );
        }
    });
    return (
        <VStack align='left' spacing={items.length > 1 ? 3 : 0}>
            <Wrap spacing='10px'>{tagsList}</Wrap>
            <EditableItem
                ref={lastInputRef as RefObject<HTMLInputElement>}
                defaultStr={defaultStr}
                isLast={true}
                item={items[items.length - 1]}
                addNewEntry={handleAddItem}
                removeFromList={() => handleRemoveItem(items.length - 1)}
                setValue={(value: string) => handleSetValue(items.length - 1, value)}
                toggleIsEdited={() => handleToggleEdited(items.length - 1)}
                handleEnter={handleEnter}
                color={items[items.length - 1].isEdited ? '' : 'gray.400'}
            />
            );
        </VStack>
    );
}
