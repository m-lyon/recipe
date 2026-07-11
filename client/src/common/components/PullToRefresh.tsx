import { Box } from '@chakra-ui/react';

import { PULL_THRESHOLD, usePullToRefresh } from '@recipe/common/hooks';

import { BraisingLoader } from './BraisingLoader';

const INDICATOR_SIZE = 60;

// Option A: single in-flow container. No position:fixed, so growing its height
// pushes the following content (e.g. the "Recipes" header / recipe title) down
// in normal document flow, giving the classic stretch-then-reveal feel while the
// animation rides along inside it.
export function PullToRefresh() {
    const { isStandalone, pullDistance, refreshing } = usePullToRefresh();

    if (!isStandalone) {
        return null;
    }

    const indicatorHeight = refreshing ? INDICATOR_SIZE : pullDistance;
    if (indicatorHeight <= 0) {
        return null;
    }

    return (
        <Box
            display='flex'
            alignItems='center'
            justifyContent='center'
            height={`${indicatorHeight}px`}
            overflow='hidden'
        >
            <Box opacity={Math.min(indicatorHeight / PULL_THRESHOLD, 1)}>
                <BraisingLoader size={INDICATOR_SIZE} />
            </Box>
        </Box>
    );
}
