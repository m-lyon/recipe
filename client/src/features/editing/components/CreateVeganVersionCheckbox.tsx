import { useShallow } from 'zustand/shallow';
import { Checkbox, Group, Text } from '@mantine/core';

import { useRecipeStore } from '@recipe/stores';

export function CreateVeganVersionCheckbox() {
    const { createVeganVersion, setCreateVeganVersion } = useRecipeStore(
        useShallow((state) => ({
            createVeganVersion: state.createVeganVersion,
            setCreateVeganVersion: state.setCreateVeganVersion,
        }))
    );

    return (
        <Group>
            <Checkbox
                checked={createVeganVersion}
                onChange={(e) => setCreateVeganVersion(e.currentTarget.checked)}
                aria-label='Create vegan version of this recipe'
            />
            <Text fw={500} c={createVeganVersion ? undefined : 'dimmed'}>
                Create vegan version
            </Text>
        </Group>
    );
}
