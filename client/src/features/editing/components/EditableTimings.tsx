import { Group, Select, Stack, Text } from '@mantine/core';

import { useRecipeStore } from '@recipe/stores';

const HOUR_OPTIONS = Array.from({ length: 25 }, (_, i) => String(i));
const MINUTE_OPTIONS = ['0', '5', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

interface TimingPickerProps {
    label: string;
    value: number | null;
    onChange: (value: number | null) => void;
    ariaLabel: string;
}

function TimingPicker({ label, value, onChange, ariaLabel }: TimingPickerProps) {
    const hours = value !== null ? String(Math.floor(value / 60)) : null;
    const minutes = value !== null ? String(value % 60) : null;

    const handleChange = (newHours: string | null, newMinutes: string | null) => {
        if (newHours === null && newMinutes === null) {
            onChange(null);
            return;
        }
        const h = newHours !== null ? parseInt(newHours, 10) : 0;
        const m = newMinutes !== null ? parseInt(newMinutes, 10) : 0;
        const total = h * 60 + m;
        onChange(total === 0 ? null : total);
    };

    return (
        <Stack gap={4}>
            <Text size='sm' fw={500}>
                {label}
            </Text>
            <Group gap='xs' wrap='nowrap'>
                <Select
                    placeholder='-- hr'
                    data={HOUR_OPTIONS}
                    value={hours}
                    onChange={(h) => handleChange(h, minutes)}
                    allowDeselect
                    clearable
                    w={80}
                    aria-label={`${ariaLabel} hours`}
                />
                <Select
                    placeholder='-- min'
                    data={MINUTE_OPTIONS}
                    value={minutes}
                    onChange={(m) => handleChange(hours, m)}
                    allowDeselect
                    clearable
                    w={90}
                    aria-label={`${ariaLabel} minutes`}
                />
            </Group>
        </Stack>
    );
}

export function EditableTimings() {
    const { activeTime, setActiveTime, passiveTime, setPassiveTime } = useRecipeStore(
        (state) => ({
            activeTime: state.activeTime,
            setActiveTime: state.setActiveTime,
            passiveTime: state.passiveTime,
            setPassiveTime: state.setPassiveTime,
        })
    );

    return (
        <Group gap='xl' align='flex-start'>
            <TimingPicker
                label='Active Time'
                value={activeTime}
                onChange={setActiveTime}
                ariaLabel='active time'
            />
            <TimingPicker
                label='Passive Time'
                value={passiveTime}
                onChange={setPassiveTime}
                ariaLabel='passive time'
            />
        </Group>
    );
}
