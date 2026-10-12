import { BsCup } from 'react-icons/bs';
import { LuRuler } from 'react-icons/lu';
import { LuPencil } from 'react-icons/lu';
import { IconButton, IconButtonProps, Tooltip } from '@chakra-ui/react';

import { usePreferencesStore } from '@recipe/stores';
import { UnitSystemPreference } from '@recipe/utils/units';

const OPTIONS: Array<{ value: UnitSystemPreference; label: string; icon: React.ReactElement }> = [
    { value: 'as-written', label: 'As written', icon: <LuPencil /> },
    { value: 'metric', label: 'Metric', icon: <LuRuler /> },
    { value: 'us', label: 'US', icon: <BsCup stroke='currentColor' strokeWidth={0.6} /> },
];

/** Cycles the system quantities are shown in. The recipe itself never changes. */
export function UnitSystemToggle(props: Omit<IconButtonProps, 'aria-label'>) {
    const unitSystem = usePreferencesStore((state) => state.unitSystem);
    const setUnitSystem = usePreferencesStore((state) => state.setUnitSystem);
    const index = Math.max(
        0,
        OPTIONS.findIndex((option) => option.value === unitSystem)
    );
    const current = OPTIONS[index];
    const next = OPTIONS[(index + 1) % OPTIONS.length];
    const label = `Showing quantities: ${current.label}. Switch to ${next.label}`;
    return (
        <Tooltip label={label} openDelay={500}>
            <IconButton
                aria-label={label}
                icon={next.icon}
                onClick={() => setUnitSystem(next.value)}
                {...props}
            />
        </Tooltip>
    );
}
