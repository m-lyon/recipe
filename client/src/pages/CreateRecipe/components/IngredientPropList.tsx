import { LayoutGroup } from 'framer-motion';
import { GetIngredientOptsQuery } from '../../../__generated__/graphql';
import { DropdownItem } from '../../../components/DropdownItem';
import { useState, useEffect, MutableRefObject } from 'react';

export interface PropListOpt {
    value: string;
    colour?: string;
    _id: undefined;
}
interface Props {
    strValue: string;
    data: GetIngredientOptsQuery;
    setItem: (value: string | null, _id?: string) => void;
    setIsSelecting: (value: boolean) => void;
    filter: (data: GetIngredientOptsQuery, value: string) => Array<PropListOpt>;
    handleSubmit?: () => void;
    inputRef: MutableRefObject<HTMLInputElement | null>;
    previewRef: MutableRefObject<HTMLDivElement | null>;
}
export function IngredientPropList(props: Props) {
    const { strValue, data, setItem, setIsSelecting, filter, handleSubmit, inputRef, previewRef } =
        props;
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const suggestions = filter(data, strValue);

    // NOTE: previewRef is used here to ensure when the user clicks to select,
    // that the Editable component is refocused, this is because clicking on the
    // DropdownItem will blue the Editable component.

    useEffect(() => {
        if (highlightedIndex > suggestions.length - 1) {
            setHighlightedIndex(suggestions.length - 1);
        }
    }, [suggestions.length]);

    const handleSkip = () => {
        setItem(null);
        if (typeof handleSubmit !== 'undefined') {
            handleSubmit();
        }
    };

    const handleAddNew = () => {
        setItem(null); // TODO
    };

    const handleSelect = (item: PropListOpt) => {
        setItem(item.value, item._id);
        if (typeof handleSubmit !== 'undefined') {
            console.log('beeep');
            handleSubmit();
        }
    };

    const getHandler = (item: PropListOpt) => {
        if (item.value.startsWith('skip ')) {
            return handleSkip;
        } else if (item.value.startsWith('add new ')) {
            return handleAddNew;
        } else {
            return () => handleSelect(item);
        }
    };

    const handleKeyboardEvent = (event: KeyboardEvent) => {
        if (event.key === 'ArrowDown' && highlightedIndex < suggestions.length - 1) {
            setHighlightedIndex((index) => (index += 1));
        } else if (event.key === 'ArrowUp' && highlightedIndex > 0) {
            event.preventDefault();
            setHighlightedIndex((index) => (index -= 1));
        } else if (event.key === 'Enter') {
            event.preventDefault();
            if (highlightedIndex !== -1) {
                getHandler(suggestions[highlightedIndex])();
            }
        }
    };
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.addEventListener('keydown', handleKeyboardEvent);
        }

        return () => {
            if (inputRef.current) {
                // Cleanup: Remove the event listener when the component unmounts
                inputRef.current.removeEventListener('keydown', handleKeyboardEvent);
            }
        };
    }, [highlightedIndex]);

    const listItems = suggestions.map((item, index) => {
        const clickHandler = getHandler(item);
        return (
            <DropdownItem
                key={index}
                color={item.colour}
                value={item.value}
                onClick={() => {
                    clickHandler();
                    previewRef?.current?.focus();
                }}
                setIsSelecting={setIsSelecting}
                isHighlighted={index === highlightedIndex}
                setHighlighted={() => setHighlightedIndex(index)}
            />
        );
    });

    return <LayoutGroup>{listItems}</LayoutGroup>;
}
