import { GetPrepMethodsQuery } from '../../../../../__generated__/graphql';
import { MutableRefObject, useRef } from 'react';
import { useDisclosure } from '@chakra-ui/react';
import { matchSorter } from 'match-sorter';
import { PrepMethod } from '../../../../../__generated__/graphql';
import { Popover, PopoverAnchor } from '@chakra-ui/react';
import { DropdownItem } from '../../../../../components/DropdownItem';
import { LayoutGroup } from 'framer-motion';
import { Suggestion } from '../../../types';
import { useNavigatableList } from '../../../hooks/useNavigatableList';
import { NewPrepMethodPopover } from './NewPrepMethodPopover';

interface Props {
    strValue: string;
    data: GetPrepMethodsQuery;
    setItem: (value: string | null, _id?: string) => void;
    handleSubmit: () => void;
    inputRef: MutableRefObject<HTMLInputElement | null>;
    previewRef: MutableRefObject<HTMLDivElement | null>;
}
export function PrepMethodDropdownList(props: Props) {
    const { strValue, data, setItem, handleSubmit, inputRef, previewRef } = props;
    const dropdownRef = useRef<HTMLDivElement | null>(null);
    const firstFieldRef = useRef<HTMLInputElement | null>(null);
    const { isOpen, onOpen, onClose } = useDisclosure({
        onClose: () => previewRef.current?.focus(),
    });
    const filter = (data: GetPrepMethodsQuery, value: string): Suggestion[] => {
        const items = matchSorter<PrepMethod>(data.prepMethodMany, value, {
            keys: ['value'],
        }) as Suggestion[];
        if (value === '') {
            items.unshift({ value: 'skip prep method', colour: 'gray.400', _id: undefined });
        }
        if (items.length === 0) {
            items.push({ value: 'add new prep method', colour: 'gray.400', _id: undefined });
        }
        return items;
    };
    const suggestions = filter(data, strValue);

    const handleSelect = (item: Suggestion) => {
        if (item.value === 'skip prep method') {
            setItem(null);
            handleSubmit();
        } else if (item.value === 'add new prep method') {
            onOpen();
        } else {
            setItem(item.value, item._id);
            handleSubmit();
        }
    };

    const { highlightedIndex, setHighlightedIndex } = useNavigatableList<Suggestion>(
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
                value={item.value}
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
