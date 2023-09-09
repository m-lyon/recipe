import { Tag, TagCloseButton, TagLabel, VStack, Wrap, WrapItem } from '@chakra-ui/react';
import { UseItemListReturnType } from '../hooks/useItemList';
import { useEnterFocus } from '../hooks/useEnterCapture';
import { EditableItem } from './EditableItem';
import { RefObject } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';

export function EditableTagList(props: UseItemListReturnType) {
    const { items, defaultStr, actionHandler } = props;
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
                            <TagCloseButton onClick={() => actionHandler.removeItem(index)} />
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
                        addNewEntry={actionHandler.addItem}
                        removeFromList={() => actionHandler.removeItem(items.length - 1)}
                        setValue={(value: string) =>
                            actionHandler.setValue(items.length - 1, value)
                        }
                        toggleIsEdited={() => actionHandler.toggleEdited(items.length - 1)}
                        handleEnter={handleEnter}
                        color={items[items.length - 1].isEdited ? '' : 'gray.400'}
                    />
                </motion.div>
            </LayoutGroup>
        </VStack>
    );
}
