import { List } from '@chakra-ui/react';
import { MutableRefObject } from 'react';
import { useQuery } from '@apollo/client';
import { LayoutGroup, motion } from 'framer-motion';

import { GET_TAGS } from '@recipe/graphql/queries/tag';

import { TagDropdownList } from './TagDropdownList';
import { EditableTag, EditableTagActionHandler, FinishedTag } from '../hooks/useTagList';

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
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ position: 'absolute', zIndex: 1 }}
            >
                <List
                    color='rgba(0, 0, 0, 0.64)'
                    bg='white'
                    borderRadius='4px'
                    borderBottom='1px solid rgba(0,0,0,0.1)'
                    borderLeft='1px solid rgba(0,0,0,0.1)'
                    borderRight='1px solid rgba(0,0,0,0.1)'
                    boxShadow='6px 5px 8px rgba(0,50,30,0.02)'
                    position='absolute'
                    maxHeight='14em'
                    overflowY='auto'
                >
                    <LayoutGroup>{getSuggestionsList()}</LayoutGroup>
                </List>
            </motion.div>
        )
    );
}
