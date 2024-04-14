import { useRef } from 'react';

export function useEnterFocus() {
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
