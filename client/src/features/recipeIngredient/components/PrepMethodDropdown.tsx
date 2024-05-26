import { matchSorter } from 'match-sorter';
import { LayoutGroup } from 'framer-motion';
import { MutableRefObject, useRef } from 'react';
import { Popover, PopoverAnchor, useDisclosure } from '@chakra-ui/react';

import { DropdownItem } from '@recipe/common/components';
import { useNavigatableList } from '@recipe/common/hooks';
import { PrepMethod, PrepMethodCreate } from '@recipe/graphql/generated';

import { NewPrepMethodPopover } from './NewPrepMethodPopover';

type PrepMethodType = PrepMethod | PrepMethodCreate;
export interface PrepMethodSuggestion {
    value: string | PrepMethodType;
    colour?: string;
}
interface Props {
    strValue: string;
    data: PrepMethodType[];
    setItem: (value: PrepMethodType | null, _id?: string) => void;
    handleSubmit: () => void;
    inputRef: MutableRefObject<HTMLInputElement | null>;
    previewRef: MutableRefObject<HTMLDivElement | null>;
}
export function PrepMethodDropdown(props: Props) {
    const { strValue, data, setItem, handleSubmit, inputRef, previewRef } = props;
    const dropdownRef = useRef<HTMLLIElement | null>(null);
    const firstFieldRef = useRef<HTMLInputElement | null>(null);
    const { isOpen, onOpen, onClose } = useDisclosure({
        onClose: () => previewRef.current?.focus(),
    });
    const filter = (data: PrepMethodType[], value: string): PrepMethodSuggestion[] => {
        const items = matchSorter<PrepMethodType>(data, value, {
            keys: ['value'],
        }).map((item) => ({ value: item })) as PrepMethodSuggestion[];
        if (value === '') {
            items.unshift({ value: 'skip prep method', colour: 'gray.400' });
        } else {
            items.push({ value: 'add new prep method', colour: 'gray.400' });
        }
        return items;
    };
    const suggestions = filter(data, strValue);
    const handleSelect = (item: PrepMethodSuggestion) => {
        if (typeof item.value === 'string') {
            if (item.value === 'skip prep method') {
                setItem(null);
                handleSubmit();
            } else if (item.value === 'add new prep method') {
                onOpen();
            }
        } else {
            setItem(item.value);
            handleSubmit();
        }
    };

    const { highlightedIndex, setHighlightedIndex } = useNavigatableList<PrepMethodSuggestion>(
        suggestions,
        handleSelect,
        inputRef
    );

    const listItems = suggestions.map((item, index) => {
        if (item.value === 'add new prep method') {
            return (
                <PopoverAnchor key={index}>
                    <DropdownItem
                        key={index}
                        color={item.colour}
                        value={item.value}
                        onClick={() => {
                            handleSelect(item);
                            previewRef?.current?.focus();
                        }}
                        isHighlighted={index === highlightedIndex}
                        setHighlighted={() => setHighlightedIndex(index)}
                        resetHighlighted={() => setHighlightedIndex(-1)}
                        ref={dropdownRef}
                    />
                </PopoverAnchor>
            );
        }
        return (
            <DropdownItem
                key={index}
                color={item.colour}
                value={typeof item.value === 'string' ? item.value : item.value.value}
                onClick={() => {
                    handleSelect(item);
                    previewRef?.current?.focus();
                }}
                isHighlighted={index === highlightedIndex}
                setHighlighted={() => setHighlightedIndex(index)}
                resetHighlighted={() => setHighlightedIndex(-1)}
            />
        );
    });

    return (
        <Popover
            isOpen={isOpen}
            onOpen={onOpen}
            onClose={onClose}
            closeOnBlur={false}
            placement='right'
            initialFocusRef={firstFieldRef}
            returnFocusOnClose={true}
        >
            <LayoutGroup>{listItems}</LayoutGroup>
            <NewPrepMethodPopover
                firstFieldRef={firstFieldRef}
                onClose={onClose}
                handleSelect={handleSelect}
            />
        </Popover>
    );
}
