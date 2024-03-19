import { useQuery } from '@apollo/client';
import { Box, List } from '@chakra-ui/react';
import { MutableRefObject } from 'react';
import { motion, LayoutGroup } from 'framer-motion';
import { TagDropdownList } from './TagDropdownList';
import { EditableTag, EditableTagActionHandler, FinishedTag } from '../hooks/useTagList';
import { GET_TAGS } from '../../../graphql/queries/tag';

interface Props {
    tag: EditableTag;
    actions: EditableTagActionHandler;
    inputRef: MutableRefObject<HTMLInputElement | null>;
    selectedTags: FinishedTag[];
}
export function TagDropdown(props: Props) {
    const { tag, actions, inputRef, selectedTags } = props;
    const { data } = useQuery(GET_TAGS);
    const strValue = tag.value !== null ? tag.value : '';

    const getSuggestionsList = () => {
        if (!data) {
            return [];
        }
        return (
            <TagDropdownList
                strValue={strValue}
                tags={data.tagMany}
                setAndSubmit={(value: string, _id: string, isNew?: boolean) => {
                    actions.setAndSubmit(value, _id, isNew);
                    actions.setShow('off');
                }}
                inputRef={inputRef}
                selectedTags={selectedTags}
            />
        );
    };

    return (
        tag.show && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Box pb={4} mb={4}>
                    <List
                        color='rgba(0, 0, 0, 0.64)'
                        bg='white'
                        borderRadius='4px'
                        borderBottom={tag.show ? '1px solid rgba(0,0,0,0.1)' : undefined}
                        borderLeft={tag.show ? '1px solid rgba(0,0,0,0.1)' : undefined}
                        borderRight={tag.show ? '1px solid rgba(0,0,0,0.1)' : undefined}
                        boxShadow='6px 5px 8px rgba(0,50,30,0.02)'
                        position='absolute'
                        maxHeight={tag.show ? '14em' : undefined}
                        overflowY={tag.show ? 'auto' : undefined}
                    >
                        <LayoutGroup>{getSuggestionsList()}</LayoutGroup>
                    </List>
                </Box>
            </motion.div>
        )
    );
}
