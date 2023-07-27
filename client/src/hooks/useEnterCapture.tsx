import { useRef, RefObject } from 'react';

export function useEnterFocus(): [
    RefObject<HTMLInputElement | null>,
    (event: KeyboardEvent) => void
] {
    const lastInputRef = useRef<HTMLInputElement | null>(null);

    function handleEnter(event: KeyboardEvent) {
        if (event.key === 'Enter' && lastInputRef.current) {
            setTimeout(() => {
                lastInputRef.current?.focus();
            }, 0);
        }
    }

    return [lastInputRef, handleEnter];
}
