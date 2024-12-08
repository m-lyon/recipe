import { RefObject } from 'react';
import { List } from '@chakra-ui/react';
import { LayoutGroup, motion } from 'framer-motion';

import { useRecipeStore } from '@recipe/stores';

import { TagDropdownList } from './TagDropdownList';

interface Props {
    inputRef: RefObject<HTMLInputElement>;
}
export function TagDropdown(props: Props) {
    const { inputRef } = props;
    const dropdownIsOpen = useRecipeStore((state) => state.tagsDropdownIsOpen);

    return (
        dropdownIsOpen && (
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
                    aria-label='Tag suggestions'
                >
                    <LayoutGroup>
                        <TagDropdownList inputRef={inputRef} />
                    </LayoutGroup>
                </List>
            </motion.div>
        )
    );
}
