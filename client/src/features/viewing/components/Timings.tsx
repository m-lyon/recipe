import { Group, Text } from '@mantine/core';

import { formatTime } from '@recipe/utils/time';

interface Props {
    activeTime?: number | null;
    passiveTime?: number | null;
}

export function Timings({ activeTime, passiveTime }: Props) {
    if (!activeTime && !passiveTime) {
        return null;
    }
    return (
        <Group gap='lg'>
            {activeTime != null && (
                <Text size='sm' fw={500}>
                    Active: {formatTime(activeTime)}
                </Text>
            )}
            {passiveTime != null && (
                <Text size='sm' fw={500}>
                    Passive: {formatTime(passiveTime)}
                </Text>
            )}
        </Group>
    );
}
