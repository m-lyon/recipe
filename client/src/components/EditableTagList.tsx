import { Wrap, WrapItem } from '@chakra-ui/react';
import { useEditableItemList } from '../hooks/useEditableItemList';
import { useEnterFocus } from '../hooks/useEnterCapture';
import { EditableItem } from './EditableItem';

export function EditableTagList() {
    const defaultStr = 'Add a tag...';
    const {
        items: tags,
        handleAddItem,
        handleRemoveItem,
        handleSetValue,
        handleToggleEdited,
    } = useEditableItemList(defaultStr);
    const [lastInputRef, handleEnter] = useEnterFocus();

    const tagsList = tags.map((tag, index) => {
        return (
            <WrapItem color={tag.isEdited ? '' : 'gray.400'} key={index}>
                <EditableItem
                    ref={index === tags.length - 1 ? lastInputRef : null}
                    defaultStr={defaultStr}
                    isLast={index + 1 === tags.length}
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
