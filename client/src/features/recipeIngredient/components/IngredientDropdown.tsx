import { RefObject } from 'react';
import { TbSoup } from 'react-icons/tb';

import { displayValue } from '@recipe/utils/formatting';
import { DropdownItem, DropdownList } from '@recipe/common/components';

import { Suggestion } from '../utils/suggestions';

interface Props {
    item: EditableRecipeIngredient;
    suggestions: Suggestion[];
    listRef: RefObject<HTMLUListElement>;
    previewRef?: RefObject<HTMLInputElement>;
    active: number;
    setActive: (index: number) => void;
    handleSelect: (suggestion: Suggestion) => void;
}
export function IngredientDropdown(props: Props) {
    const { item, suggestions, listRef, previewRef, active, setActive, handleSelect } = props;

    const listItems = suggestions.map((i, index) => (
        <DropdownItem
            key={index}
            color={i.colour}
            value={displayValue(item, i.value)}
            icon={
                typeof i.value === 'object' && i.value.__typename === 'Recipe' ? TbSoup : undefined
            }
            onClick={() => {
                handleSelect(i);
                previewRef?.current?.focus();
            }}
            isHighlighted={index === active}
            setHighlighted={() => setActive(index)}
        />
    ));

    return (
        <DropdownList
            isOpen={item.showDropdown}
            width='100%'
            aria-label='Dropdown suggestion list'
            ref={listRef}
        >
            {listItems}
        </DropdownList>
    );
}
