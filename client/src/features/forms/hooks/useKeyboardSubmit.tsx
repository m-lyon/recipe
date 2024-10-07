import { useEffect, useState } from 'react';

export function useKeyboardSubmit(handleSubmit: () => void) {
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
        const handleKeyboardEvent = (e: KeyboardEvent) => {
            if (isFocused && e.key === 'Enter') {
                e.preventDefault();
                handleSubmit();
            }
        };
        window.addEventListener('keydown', handleKeyboardEvent);

        return () => {
            window.removeEventListener('keydown', handleKeyboardEvent);
        };
    }, [isFocused, handleSubmit]);

    return { setIsFocused };
}
