import { matchSorter } from 'match-sorter';
import { LayoutGroup } from 'framer-motion';
import { MutableRefObject, useRef } from 'react';
import { useDisclosure, Popover, PopoverAnchor } from '@chakra-ui/react';

import { Suggestion } from '../../../types';
import { NewPrepMethodPopover } from './NewPrepMethodPopover';
import { PrepMethod } from '../../../../../__generated__/graphql';
import { DropdownItem } from '../../../../../components/DropdownItem';
import { useNavigatableList } from '../../../hooks/useNavigatableList';

type PrepMethodType = Omit<PrepMethod, 'owner'>;
interface Props {
    strValue: string;
    data: PrepMethodType[];
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
    const filter = (data: PrepMethodType[], value: string): Suggestion[] => {
        const items = matchSorter<PrepMethodType>(data, value, {
            keys: ['value'],
        }) as Suggestion[];
        if (value === '') {
            items.unshift({ value: 'skip prep method', colour: 'gray.400', _id: undefined });
        } else {
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
