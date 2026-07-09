import { Box, Flex } from '@chakra-ui/react';
import { useApolloClient } from '@apollo/client';
import { useEffect, useRef, useState } from 'react';

import { useStandalone } from '@recipe/common/hooks';

import { BraisingLoader } from './BraisingLoader';

const THRESHOLD = 80;
const MAX_PULL = 120;
const INDICATOR_SIZE = 60;

// Native-style pull-to-refresh for read screens in standalone PWA mode, where the
// browser's own pull-to-refresh is unavailable. Window-scroll based (the app scrolls
// the document and the recipe list uses react-infinite-scroll-component in window mode),
// so it deliberately does NOT introduce a wrapping overflow container. Refreshes stale
// data via a soft Apollo refetch of active queries rather than reloading the page.
export function PullToRefresh() {
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
            const distance = Math.min(delta * 0.5, MAX_PULL);
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
            const shouldRefresh = distanceRef.current >= THRESHOLD;
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

    if (!isStandalone) {
        return null;
    }

    const indicatorHeight = refreshing ? INDICATOR_SIZE : pullDistance;
    if (indicatorHeight <= 0) {
        return null;
    }

    return (
        <Flex
            position='fixed'
            top={0}
            left={0}
            right={0}
            height={`${indicatorHeight}px`}
            align='center'
            justify='center'
            zIndex={20}
            pointerEvents='none'
            overflow='hidden'
        >
            <Box opacity={Math.min(indicatorHeight / THRESHOLD, 1)}>
                <BraisingLoader size={INDICATOR_SIZE} />
            </Box>
        </Flex>
    );
}
