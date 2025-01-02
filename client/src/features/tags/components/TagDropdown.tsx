import { RefObject } from 'react';
import { motion } from 'framer-motion';

import { useRecipeStore } from '@recipe/stores';
import { DropdownItem, DropdownList } from '@recipe/common/components';

interface Props {
    suggestions: TagChoice[];
    active: number;
    handleSetActive: (index: number) => void;
    handleSelect: (suggestion: TagChoice) => void;
    listRef: RefObject<HTMLUListElement>;
}
export function TagDropdown(props: Props) {
    const { suggestions, active, handleSetActive, handleSelect, listRef } = props;
    const isOpen = useRecipeStore((state) => state.tagsDropdownIsOpen);

    const listItems = suggestions.map((item, index) => {
        return (
            <DropdownItem
                key={index}
                value={item.value}
                onClick={() => handleSelect(item)}
                isHighlighted={index === active}
                setHighlighted={() => handleSetActive(index)}
            />
        );
    });

    return (
        isOpen && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ position: 'absolute', zIndex: 1 }}
            >
                <DropdownList aria-label='Tag suggestions' position='absolute' ref={listRef}>
                    {listItems}
                </DropdownList>
            </motion.div>
        )
    );
}
