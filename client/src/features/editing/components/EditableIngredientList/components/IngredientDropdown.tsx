import { matchSorter } from 'match-sorter';
import { LayoutGroup } from 'framer-motion';
import { MutableRefObject, useRef } from 'react';
import { Popover, PopoverAnchor, useDisclosure } from '@chakra-ui/react';

import { NewIngredientPopover } from './NewIngredientPopover';
import { DropdownItem } from '../../../../../components/DropdownItem';
import { useNavigatableList } from '../../../hooks/useNavigatableList';
import { Ingredient, IngredientCreate, Unit } from '../../../../../__generated__/graphql';
import { Quantity, Recipe, ingredientDisplayStr } from '../../../hooks/useIngredientList';

export type IngredientOrRecipe = Ingredient | IngredientCreate | Recipe;
export interface IngredientSuggestion {
    value: string | IngredientOrRecipe;
    colour?: string;
}
interface Props {
    strValue: string;
    data: Array<IngredientOrRecipe>;
    quantity: Quantity;
    unit: Unit | null;
    setItem: (value: IngredientOrRecipe) => void;
    inputRef: MutableRefObject<HTMLInputElement | null>;
    previewRef: MutableRefObject<HTMLDivElement | null>;
}
export function IngredientDropdown(props: Props) {
    const { strValue, data, quantity, unit, setItem, inputRef, previewRef } = props;
    const dropdownRef = useRef<HTMLDivElement | null>(null);
    const firstFieldRef = useRef<HTMLInputElement | null>(null);
    const { isOpen, onOpen, onClose } = useDisclosure({
        onClose: () => {
            previewRef.current?.focus();
        },
    });
    const filter = (data: IngredientOrRecipe[], value: string): IngredientSuggestion[] => {
        const items = matchSorter<IngredientOrRecipe>(data, value, {
            keys: ['name', 'pluralName', 'title', 'pluralTitle'],
        }).map((item) => ({ value: item, colour: undefined })) as IngredientSuggestion[];
        items.push({ value: 'add new ingredient', colour: 'gray.400' });
        return items;
    };
    const suggestions = filter(data, strValue);

    const handleSelect = (item: IngredientSuggestion) => {
        if (typeof item.value === 'string') {
            if (item.value === 'add new ingredient') {
                onOpen();
            }
        } else {
            setItem(item.value);
        }
    };

    const { highlightedIndex, setHighlightedIndex } = useNavigatableList<IngredientSuggestion>(
        suggestions,
        handleSelect,
        inputRef
    );

    const listItems = suggestions.map((item, index) => {
        if (item.value === 'add new ingredient') {
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
                value={ingredientDisplayStr(quantity, unit, item.value as Ingredient)}
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
            <NewIngredientPopover
                firstFieldRef={firstFieldRef}
                onClose={onClose}
                handleSelect={handleSelect}
            />
        </Popover>
    );
}
