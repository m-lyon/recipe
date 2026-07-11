import { useApolloClient } from '@apollo/client';
import { useEffect, useRef, useState } from 'react';

import { useStandalone } from './useStandalone';

export const PULL_THRESHOLD = 80;
export const PULL_MAX = 120;

// Native-style pull-to-refresh for read screens in standalone PWA mode, where the
// browser's own pull-to-refresh is unavailable. Window-scroll based (the app scrolls
// the document and the recipe list uses react-infinite-scroll-component in window mode).
// Refreshes stale data via a soft Apollo refetch of active queries rather than reloading
// the page.
export function usePullToRefresh() {
    const isStandalone = useStandalone();
    const client = useApolloClient();
    const [pullDistance, setPullDistance] = useState(0);
    const [refreshing, setRefreshing] = useState(false);

    const startYRef = useRef<number | null>(null);
    const distanceRef = useRef(0);
    const refreshingRef = useRef(false);

    useEffect(() => {
        refreshingRef.current = refreshing;
    }, [refreshing]);

    useEffect(() => {
        if (!isStandalone) {
            return;
        }

        const reset = () => {
            startYRef.current = null;
            distanceRef.current = 0;
            setPullDistance(0);
        };

        const onTouchStart = (e: TouchEvent) => {
            if (refreshingRef.current) {
                return;
            }
            startYRef.current = window.scrollY === 0 ? e.touches[0].clientY : null;
        };

        const onTouchMove = (e: TouchEvent) => {
            if (startYRef.current === null || refreshingRef.current) {
                return;
            }
            const delta = e.touches[0].clientY - startYRef.current;
            // Abandon the pull if the user moves up or has scrolled away from the top.
            if (delta <= 0 || window.scrollY > 0) {
                if (distanceRef.current !== 0) {
                    reset();
                }
                return;
            }
            const distance = Math.min(delta * 0.5, PULL_MAX);
            distanceRef.current = distance;
            setPullDistance(distance);
            // Only suppress native scrolling while actively pulling at the top.
            if (e.cancelable) {
                e.preventDefault();
            }
        };

        const onTouchEnd = () => {
            if (startYRef.current === null) {
                return;
            }
            const shouldRefresh = distanceRef.current >= PULL_THRESHOLD;
            startYRef.current = null;
            if (shouldRefresh && !refreshingRef.current) {
                distanceRef.current = 0;
                setRefreshing(true);
            } else {
                reset();
            }
        };

        document.addEventListener('touchstart', onTouchStart, { passive: true });
        document.addEventListener('touchmove', onTouchMove, { passive: false });
        document.addEventListener('touchend', onTouchEnd, { passive: true });
        document.addEventListener('touchcancel', reset, { passive: true });

        return () => {
            document.removeEventListener('touchstart', onTouchStart);
            document.removeEventListener('touchmove', onTouchMove);
            document.removeEventListener('touchend', onTouchEnd);
            document.removeEventListener('touchcancel', reset);
        };
    }, [isStandalone, client]);

    useEffect(() => {
        if (!refreshing) {
            return;
        }
        let cancelled = false;
        client.refetchQueries({ include: 'active' }).finally(() => {
            if (!cancelled) {
                setRefreshing(false);
                setPullDistance(0);
            }
        });
        return () => {
            cancelled = true;
        };
    }, [refreshing, client]);

    return { isStandalone, pullDistance, refreshing };
}
