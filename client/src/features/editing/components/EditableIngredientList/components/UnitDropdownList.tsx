import { matchSorter } from 'match-sorter';
import { LayoutGroup } from 'framer-motion';
import { MutableRefObject, useRef } from 'react';
import { Popover, PopoverAnchor, useDisclosure } from '@chakra-ui/react';

import { NewUnitPopover } from './NewUnitPopover';
import { Unit } from '../../../../../__generated__/graphql';
import { DropdownItem } from '../../../../../components/DropdownItem';
import { useNavigatableList } from '../../../hooks/useNavigatableList';
import { Quantity, unitDisplayValue } from '../../../hooks/useIngredientList';

export interface UnitSuggestion {
    value: string | Unit;
    colour?: string;
}
interface Props {
    strValue: string;
    data: Unit[];
    quantity: Quantity;
    setItem: (value: Unit | null) => void;
    inputRef: MutableRefObject<HTMLInputElement | null>;
    previewRef: MutableRefObject<HTMLDivElement | null>;
}
export function UnitDropdownList(props: Props) {
    const dropdownRef = useRef<HTMLDivElement | null>(null);
    const firstFieldRef = useRef<HTMLInputElement | null>(null);
    const { isOpen, onOpen, onClose } = useDisclosure({
        onClose: () => {
            props.previewRef.current?.focus();
        },
    });

    const filter = (data: Unit[], value: string): UnitSuggestion[] => {
        const items = matchSorter<Unit>(data, value, {
            keys: ['longSingular', 'longPlural'],
        }).map((item) => ({ value: item, colour: undefined })) as UnitSuggestion[];
        if (value === '') {
            items.unshift({ value: 'skip unit', colour: 'gray.400' });
        } else {
            items.push({ value: 'add new unit', colour: 'gray.400' });
        }
        return items;
    };
    const suggestions = filter(props.data, props.strValue);

    const handleSelect = (item: UnitSuggestion) => {
        if (typeof item.value === 'string') {
            if (item.value === 'skip unit') {
                props.setItem(null);
            } else if (item.value === 'add new unit') {
                onOpen();
            }
        } else {
            props.setItem(item.value);
        }
    };

    const { highlightedIndex, setHighlightedIndex } = useNavigatableList<UnitSuggestion>(
        suggestions,
        handleSelect,
        props.inputRef
    );

    const listItems = suggestions.map((item, index) => {
        if (item.value === 'add new unit') {
            return (
                <PopoverAnchor key={index}>
                    <DropdownItem
                        key={index}
                        color={item.colour}
                        value={item.value}
                        onClick={() => {
                            handleSelect(item);
                            props.previewRef?.current?.focus();
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
                value={
                    typeof item.value === 'string'
                        ? item.value
                        : unitDisplayValue(props.quantity, item.value, false)
                }
                onClick={() => {
                    handleSelect(item);
                    props.previewRef?.current?.focus();
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
            <NewUnitPopover
                firstFieldRef={firstFieldRef}
                onClose={onClose}
                handleSelect={handleSelect}
            />
        </Popover>
    );
}
