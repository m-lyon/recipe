import { useEffect } from 'react';
import { Checkbox } from '@mantine/core';
import { useShallow } from 'zustand/shallow';

import { useRecipeStore } from '@recipe/stores';

interface Props {
    veganVersion?: { _id: string; title: string; titleIdentifier: string } | null;
}

export function CreateVeganVersionCheckbox({ veganVersion }: Props) {
    const { createVeganVersion, setCreateVeganVersion } = useRecipeStore(
        useShallow((state) => ({
            createVeganVersion: state.createVeganVersion,
            setCreateVeganVersion: state.setCreateVeganVersion,
        }))
    );

    useEffect(() => {
        if (veganVersion) {
            setCreateVeganVersion(true);
        }
    }, [veganVersion, setCreateVeganVersion]);

    const label = veganVersion ? 'Edit vegan version' : 'Create vegan version';
    const ariaLabel = veganVersion
        ? 'Edit vegan version of this recipe'
        : 'Create vegan version of this recipe';

    return (
        <Checkbox
            variant='chakra-style'
            checked={createVeganVersion}
            onChange={(e) => setCreateVeganVersion(e.currentTarget.checked)}
            aria-label={ariaLabel}
            label={label}
        />
    );
}
