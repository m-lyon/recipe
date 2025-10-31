import { useShallow } from 'zustand/shallow';
import { useMutation, useQuery } from '@apollo/client';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { Tag, TagCloseButton, TagLabel, VStack, Wrap, WrapItem } from '@chakra-ui/react';

import { useRecipeStore } from '@recipe/stores';
import { GET_TAGS } from '@recipe/graphql/queries/tag';
import { REMOVE_TAG } from '@recipe/graphql/mutations/tag';
import { useErrorToast, useInfoToast } from '@recipe/common/hooks';

import { EditableTag } from './EditableTag';

export function EditableTagList() {
    const errorToast = useErrorToast();
    const infoToast = useInfoToast();
    // Preload tags
    useQuery(GET_TAGS);
    const { finished, removeTag } = useRecipeStore(
        useShallow((state) => ({
            finished: state.finishedTags,
            removeTag: state.removeTag,
        }))
    );
    const [removeTagMutation] = useMutation(REMOVE_TAG, {
        onCompleted: (data) => {
            infoToast({
                title: 'Tag removed',
                description: `Tag ${data?.tagRemoveById?.record?.value} removed`,
                position: 'top',
            });
        },
        onError: (error) => {
            errorToast({
                title: 'Error removing tag',
                description: error.message,
                position: 'top',
            });
        },
        update: (cache, { data }) => {
            cache.evict({ id: `Tag:${data?.tagRemoveById?.record?._id}` });
        },
    });

    const tagsList = finished.map((tag, index) => {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                key={tag.key}
                layout='position'
            >
                <WrapItem>
                    <Tag colorPalette={tag.isNew ? 'green' : undefined}>
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
        <VStack align='left' gap={finished.length > 0 ? 3 : 0}>
            <LayoutGroup>
                <Wrap gap='10px'>
                    <AnimatePresence>{tagsList}</AnimatePresence>
                </Wrap>
                <motion.div layout='position'>
                    <EditableTag />
                </motion.div>
            </LayoutGroup>
        </VStack>
    );
}
