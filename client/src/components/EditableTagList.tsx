import { Tag, TagCloseButton, TagLabel, VStack, Wrap, WrapItem } from '@chakra-ui/react';
import { useItemList } from '../hooks/useItemList';
import { useEnterFocus } from '../hooks/useEnterCapture';
import { EditableItem } from './EditableItem';
import { RefObject } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';

export function EditableTagList() {
    const defaultStr = 'Add a tag...';
    const { items, handleAddItem, handleRemoveItem, handleSetValue, handleToggleEdited } =
        useItemList(defaultStr);
    const [lastInputRef, handleEnter] = useEnterFocus();
    const tagsList = items.map((tag, index) => {
        if (index !== items.length - 1) {
            return (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    key={tag.key}
                    layout='position'
                >
                    <WrapItem>
                        <Tag>
                            <TagLabel>{tag.value}</TagLabel>
                            <TagCloseButton onClick={() => handleRemoveItem(index)} />
                        </Tag>
                    </WrapItem>
                </motion.div>
            );
        }
    });
    return (
        <VStack align='left' spacing={items.length > 1 ? 3 : 0}>
            <LayoutGroup>
                <Wrap spacing='10px'>
                    <AnimatePresence>{tagsList}</AnimatePresence>
                </Wrap>
                <motion.div layout='position'>
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
                </motion.div>
            </LayoutGroup>
        </VStack>
    );
}
