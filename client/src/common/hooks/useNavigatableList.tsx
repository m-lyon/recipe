import { MutableRefObject, useEffect, useState } from 'react';

export function useNavigatableList<T>(
    list: Array<T>,
    handleEnter: (item: T) => void,
    focusRef: MutableRefObject<HTMLElement | null>,
    handleOutsideEnter?: () => void
) {
    const [highlightedIndex, setHighlightedIndex] = useState(0);

    useEffect(() => {
        if (highlightedIndex > list.length - 1) {
            setHighlightedIndex(list.length - 1);
        }
    }, [highlightedIndex, list.length]);

    useEffect(() => {
        const handleKeyboardEvent = (event: KeyboardEvent) => {
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter') {
                event.preventDefault();
            }
            if (event.key === 'ArrowDown' && highlightedIndex < list.length - 1) {
                setHighlightedIndex((index) => (index += 1));
            } else if (event.key === 'ArrowUp' && highlightedIndex > 0) {
                setHighlightedIndex((index) => (index -= 1));
            } else if (event.key === 'Enter') {
                if (highlightedIndex !== -1) {
                    handleEnter(list[highlightedIndex]);
                } else if (handleOutsideEnter) {
                    handleOutsideEnter();
                }
            }
        };

        const current = focusRef.current;
        if (current) {
            current.addEventListener('keydown', handleKeyboardEvent);
        }
        return () => {
            if (current) {
                current.removeEventListener('keydown', handleKeyboardEvent);
            }
        };
    }, [highlightedIndex, list, focusRef, handleEnter, handleOutsideEnter]);

    return { highlightedIndex, setHighlightedIndex };
}
