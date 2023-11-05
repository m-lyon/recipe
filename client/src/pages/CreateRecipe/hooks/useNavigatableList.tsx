import { useState, useEffect, MutableRefObject } from 'react';

export function useNavigatableList<T>(
    list: Array<T>,
    handleEnter: (item: T) => void,
    focusRef: MutableRefObject<HTMLElement | null>
) {
    const [highlightedIndex, setHighlightedIndex] = useState(-1);

    useEffect(() => {
        if (highlightedIndex > list.length - 1) {
            setHighlightedIndex(list.length - 1);
        }
    }, [list.length]);

    useEffect(() => {
        if (focusRef.current) {
            focusRef.current.addEventListener('keydown', handleKeyboardEvent);
        }
        return () => {
            if (focusRef.current) {
                focusRef.current.removeEventListener('keydown', handleKeyboardEvent);
            }
        };
    }, [highlightedIndex, list]);

    const handleKeyboardEvent = (event: KeyboardEvent) => {
        if (event.key === 'ArrowDown' && highlightedIndex < list.length - 1) {
            setHighlightedIndex((index) => (index += 1));
        } else if (event.key === 'ArrowUp' && highlightedIndex > 0) {
            event.preventDefault();
            setHighlightedIndex((index) => (index -= 1));
        } else if (event.key === 'Enter') {
            event.preventDefault();
            if (highlightedIndex !== -1) {
                handleEnter(list[highlightedIndex]);
            }
        }
    };

    return { highlightedIndex, setHighlightedIndex };
}
