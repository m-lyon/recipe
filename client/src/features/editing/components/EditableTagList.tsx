import { UseTagListReturnType } from '../hooks/useTagList';
import { motion, LayoutGroup, AnimatePresence } from 'framer-motion';
import { Tag, TagCloseButton, TagLabel, WrapItem, VStack, Wrap } from '@chakra-ui/react';
import { EditableTag } from './EditableTag';
import { useMutation } from '@apollo/client';
import { useToast } from '@chakra-ui/react';
import { gql } from '../../../__generated__'

// NOTE: This REMOVE_TAG cannot be moved to the mutation/tags.ts file because it
// causes an undefined error.
const REMOVE_TAG = gql(`
    mutation RemoveTag($recordId: MongoID!) {
        tagRemoveById(_id: $recordId) {
            record {
                _id
                value
            }
        }
    }
`);

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
                duration: 3000,
                isClosable: true,
            });
        },
        onError: (error) => {
            toast({
                title: 'Error removing tag',
                description: error.message,
                status: 'error',
                position: 'top',
                duration: 3000,
                isClosable: true,
            });
        },
        refetchQueries: ['GetTags'],
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
