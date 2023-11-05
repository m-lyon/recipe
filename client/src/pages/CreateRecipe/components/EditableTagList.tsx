import { UseTagListReturnType } from '../hooks/useTagList';
import { motion, LayoutGroup, AnimatePresence } from 'framer-motion';
import { Tag, TagCloseButton, TagLabel, WrapItem, VStack, Wrap } from '@chakra-ui/react';
import { EditableTag } from './EditableTag';

export function EditableTagList(props: UseTagListReturnType) {
    const { state, removeTag, actions, tagStr } = props;

    const tagsList = state.finished.map((tag, index) => {
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
                        <TagCloseButton onClick={() => removeTag(index)} />
                    </Tag>
                </WrapItem>
            </motion.div>
        );
    });

    return (
        <VStack align='left' spacing={state.finished.length > 0 ? 3 : 0}>
            <LayoutGroup>
                <Wrap spacing='10px'>
                    <AnimatePresence>{tagsList}</AnimatePresence>
                </Wrap>
                <motion.div layout='position'>
                    <EditableTag tag={state.editable} actions={actions} tagStr={tagStr} />
                </motion.div>
            </LayoutGroup>
        </VStack>
    );
}
