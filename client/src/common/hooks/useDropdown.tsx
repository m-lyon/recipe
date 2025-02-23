import { KeyboardEvent, RefObject, useCallback, useEffect, useState } from 'react';

export function useDropdown<T>(items: T[], listRef: RefObject<HTMLUListElement>) {
    const [active, setActive] = useState(0);
    const [isScrolling, setIsScrolling] = useState(false);

    useEffect(() => {
        if (active > items.length - 1) {
            setActive(Math.max(items.length - 1, 0));
        }
    }, [active, items.length]);

    useEffect(() => {
        // Scroll the active item into view if it exists
        if (active !== -1 && listRef.current) {
            const activeItem = listRef.current.children[active];
            activeItem?.scrollIntoView({ block: 'nearest' });
        }
    }, [active, listRef]);

    const resetView = useCallback(() => {
        setActive(0);
        listRef.current?.scrollTo({ top: 0, behavior: 'instant' });
    }, [listRef]);

    const handleKeyboardEvent = useCallback(
        (e: KeyboardEvent, handleSelect: (item: T) => void) => {
            if (['ArrowDown', 'ArrowUp', 'Enter'].includes(e.key)) {
                e.preventDefault();
            }
            if (e.key === 'ArrowDown' && active < items.length - 1) {
                setActive((index) => (index += 1));
                setIsScrolling(true);
            } else if (e.key === 'ArrowUp' && active > 0) {
                setActive((index) => (index -= 1));
                setIsScrolling(true);
            } else if (e.key === 'Enter') {
                handleSelect(items[active]);
            }
        },
        [active, items]
    );

    const handleSetActive = useCallback(
        (index: number) => {
            if (!isScrolling) {
                setActive(index);
            } else {
                setIsScrolling(false);
            }
        },
        [isScrolling]
    );

    return { active, handleSetActive, handleKeyboardEvent, resetView };
}
