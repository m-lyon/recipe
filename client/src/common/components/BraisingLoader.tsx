import Lottie from 'lottie-react';
import { Center, Stack, Text } from '@mantine/core';

import braisingAnimation from '../../assets/braising.json';

interface BraisingLoaderProps {
    size?: number;
    label?: string;
    h?: string | number;
}

export function BraisingLoader({ size = 100, label = 'Braising...', h }: BraisingLoaderProps) {
    return (
        <Center role='status' aria-label='Loading' h={h}>
            <Stack align='center' gap='xs'>
                <Lottie
                    animationData={braisingAnimation}
                    loop
                    style={{ width: size, height: size }}
                />
                <Text c='dimmed' size='sm'>
                    {label}
                </Text>
            </Stack>
        </Center>
    );
}
