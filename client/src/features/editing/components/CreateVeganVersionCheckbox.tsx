import { Checkbox } from '@mantine/core';
import { useShallow } from 'zustand/shallow';

import { useRecipeStore } from '@recipe/stores';

export function CreateVeganVersionCheckbox() {
    const { createVeganVersion, setCreateVeganVersion } = useRecipeStore(
        useShallow((state) => ({
            createVeganVersion: state.createVeganVersion,
            setCreateVeganVersion: state.setCreateVeganVersion,
        }))
    );

    return (
        <Checkbox
            variant='chakra-style'
            checked={createVeganVersion}
            onChange={(e) => setCreateVeganVersion(e.currentTarget.checked)}
            aria-label='Create vegan version of this recipe'
            label='Create vegan version'
        />
    );
}
