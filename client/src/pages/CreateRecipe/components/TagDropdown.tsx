import { useQuery } from '@apollo/client';
import { Box, List } from '@chakra-ui/react';
import { MutableRefObject } from 'react';
import { motion, LayoutGroup } from 'framer-motion';
import { gql } from '../../../__generated__/gql';
import { TagDropdownList } from './TagDropdownList';
import { EditableTag, EditableTagActionHandler } from '../hooks/useTagList';

export const GET_TAGS = gql(`
    query GetTags {
        tagMany {
            _id
            value
        }
    }
`);

interface Props {
    tag: EditableTag;
    actions: EditableTagActionHandler;
    inputRef: MutableRefObject<HTMLInputElement | null>;
    setIsSelecting: (value: boolean) => void;
}
export function TagDropdown(props: Props) {
    const { tag, actions, inputRef, setIsSelecting } = props;
    const { loading, error, data } = useQuery(GET_TAGS);
    const strValue = tag.value !== null ? tag.value : '';

    const getSuggestionsList = () => {
        if (!data) {
            return [];
        }
        return (
            <TagDropdownList
                strValue={strValue}
                tags={data.tagMany}
                setAndSubmit={(value: string, _id?: string) => {
                    actions.setAndSubmit(value, _id);
                    actions.setShow('off');
                }}
                inputRef={inputRef}
                setIsSelecting={setIsSelecting}
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
                        zIndex={1}
                        position={'absolute'}
                    >
                        <LayoutGroup>{getSuggestionsList()}</LayoutGroup>
                    </List>
                </Box>
            </motion.div>
        )
    );
}