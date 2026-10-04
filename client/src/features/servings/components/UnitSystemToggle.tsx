import { Select, SelectProps } from '@chakra-ui/react';

import { usePreferencesStore } from '@recipe/stores';
import { UnitSystemPreference } from '@recipe/utils/units';

const OPTIONS: Array<{ value: UnitSystemPreference; label: string }> = [
    { value: 'as-written', label: 'As written' },
    { value: 'metric', label: 'Metric' },
    { value: 'us', label: 'US' },
];

/** Lets a reader see quantities in another system. The recipe itself never changes. */
export function UnitSystemToggle(props: SelectProps) {
    const unitSystem = usePreferencesStore((state) => state.unitSystem);
    const setUnitSystem = usePreferencesStore((state) => state.setUnitSystem);
    return (
        <Select
            size='xs'
            width='auto'
            minW='7.5em'
            variant='outline'
            aria-label='Show quantities in'
            value={unitSystem}
            onChange={(e) => setUnitSystem(e.target.value as UnitSystemPreference)}
            {...props}
        >
            {OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </Select>
    );
}
