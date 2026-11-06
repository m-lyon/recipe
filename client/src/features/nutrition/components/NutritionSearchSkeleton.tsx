import { Skeleton, Stack } from '@chakra-ui/react';

export function NutritionSearchSkeleton() {
    return (
        <Stack spacing={3}>
            <Skeleton height='10px' width='40%' />
            <Skeleton height='10px' />
            <Skeleton height='10px' />
            <Skeleton height='10px' width='40%' />
            <Skeleton height='10px' />
            <Skeleton height='10px' />
        </Stack>
    );
}
