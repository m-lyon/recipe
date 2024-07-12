import { useMutation } from '@apollo/client';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { Tag, TagCloseButton, TagLabel, VStack, Wrap, WrapItem, useToast } from '@chakra-ui/react';

import { DELAY_LONG } from '@recipe/constants';
import { REMOVE_TAG } from '@recipe/graphql/mutations/tag';

import { EditableTag } from './EditableTag';
import { UseTagListReturnType } from '../hooks/useTagList';

export function EditableTagList(props: UseTagListReturnType) {
    const { state, removeTag, actions, tagStr } = props;
    const toast = useToast();
    const [removeTagMutation] = useMutation(REMOVE_TAG, {
        onCompleted: (data) => {
            toast({
                title: 'Tag removed',
                description: `Tag ${data?.tagRemoveById?.record?.value} removed`,
                status: 'success',
                position: 'top',
                duration: DELAY_LONG,
                isClosable: true,
            });
        },
        onError: (error) => {
            toast({
                title: 'Error removing tag',
                description: error.message,
                status: 'error',
                position: 'top',
                duration: DELAY_LONG,
                isClosable: true,
            });
        },
        update: (cache, { data }) => {
            cache.evict({ id: `Tag:${data?.tagRemoveById?.record?._id}` });
        },
    });

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
                    <Tag colorScheme={tag.isNew ? 'green' : undefined}>
                        <TagLabel>{tag.value}</TagLabel>
                        <TagCloseButton
                            onClick={() => {
                                removeTag(index);
                                if (tag.isNew) {
                                    removeTagMutation({ variables: { recordId: tag._id } });
                                }
                            }}
                            aria-label={`Remove ${tag.value} tag`}
                        />
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
                    <EditableTag
                        tag={state.editable}
                        actions={actions}
                        tagStr={tagStr}
                        selectedTags={state.finished}
                    />
                </motion.div>
            </LayoutGroup>
        </VStack>
    );
}
