import { useEffect, useRef, useState } from 'react';

export function useMinimumLoading(isLoading: boolean, minMs: number): boolean {
    const [show, setShow] = useState(isLoading);
    const startRef = useRef<number | null>(null);

    useEffect(() => {
        if (isLoading) {
            startRef.current = Date.now();
            setShow(true);
        } else if (startRef.current !== null) {
            const remaining = minMs - (Date.now() - startRef.current);
            if (remaining <= 0) {
                setShow(false);
            } else {
                const id = setTimeout(() => setShow(false), remaining);
                return () => clearTimeout(id);
            }
        }
    }, [isLoading, minMs]);

    return show;
}
