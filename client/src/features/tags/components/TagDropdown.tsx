import { RefObject } from 'react';
import { BoxProps } from '@chakra-ui/react';

import { DropdownItem, DropdownList } from '@recipe/common/components';

interface Props {
    isOpen: boolean;
    width?: BoxProps['width'];
    suggestions: TagChoice[];
    active: number;
    handleSetActive: (index: number) => void;
    handleSelect: (suggestion: TagChoice) => void;
    listRef: RefObject<HTMLUListElement>;
}
export function TagDropdown(props: Props) {
    const { isOpen, width, suggestions, active, handleSetActive, handleSelect, listRef } = props;

    const listItems = suggestions.map((tag, index) => (
        <DropdownItem
            key={index}
            value={tag.value}
            onClick={() => handleSelect(tag)}
            isHighlighted={index === active}
            setHighlighted={() => handleSetActive(index)}
        />
    ));

    return (
        <DropdownList isOpen={isOpen} aria-label='Tag suggestions' ref={listRef} width={width}>
            {listItems}
        </DropdownList>
    );
}
