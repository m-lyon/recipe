import { IconType } from 'react-icons';
import { matchSorter } from 'match-sorter';
import { useEffect, useState } from 'react';
import { Combobox, Group, Text, TextInput, useCombobox } from '@mantine/core';

export interface SearchableSelectOption {
    value: string;
    label: string;
    colour?: string;
    icon?: IconType;
}

interface Props {
    options: SearchableSelectOption[];
    value: string | null | undefined;
    onChange: (value: string) => void;
    placeholder?: string;
    label?: string;
    disabled?: boolean;
    'aria-label'?: string;
}

export function SearchableSelect({
    options,
    value,
    onChange,
    label,
    disabled,
    'aria-label': ariaLabel,
}: Props) {
    const combobox = useCombobox({
        onDropdownClose: () => combobox.resetSelectedOption(),
    });

    const selectedOption = options.find((opt) => opt.value === value) ?? null;
    const [search, setSearch] = useState(selectedOption?.label ?? '');

    // Sync the search text when the external value changes (e.g. after delete resets to undefined)
    useEffect(() => {
        const selected = options.find((opt) => opt.value === value) ?? null;
        setSearch(selected?.label ?? '');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    const filteredOptions = matchSorter(options, search, { keys: ['label'] });

    const optionItems = filteredOptions.map((opt) => {
        const Icon = opt.icon;
        return (
            <Combobox.Option value={opt.value} key={opt.value}>
                <Group gap='xs'>
                    <Text c={opt.colour}>{opt.label}</Text>
                    {Icon && <Icon />}
                </Group>
            </Combobox.Option>
        );
    });

    return (
        <Combobox
            store={combobox}
            width='target'
            onOptionSubmit={(val) => {
                onChange(val);
                const selected = options.find((opt) => opt.value === val);
                setSearch(selected?.label ?? '');
                combobox.closeDropdown();
            }}
        >
            <Combobox.Target>
                <TextInput
                    w='100%'
                    label={label}
                    labelProps={{ style: { fontSize: '16px', marginBottom: '8px' } }}
                    styles={{ input: { fontSize: '16px' } }}
                    rightSection={<Combobox.Chevron />}
                    rightSectionPointerEvents='none'
                    value={search}
                    onChange={(event) => {
                        combobox.openDropdown();
                        combobox.updateSelectedOptionIndex();
                        setSearch(event.currentTarget.value);
                    }}
                    onClick={() => {
                        setSearch('');
                        combobox.openDropdown();
                    }}
                    onFocus={() => {
                        setSearch('');
                        combobox.openDropdown();
                    }}
                    onBlur={() => {
                        combobox.closeDropdown();
                        setSearch(selectedOption?.label ?? '');
                    }}
                    disabled={disabled}
                    aria-label={ariaLabel}
                />
            </Combobox.Target>

            <Combobox.Dropdown>
                <Combobox.Options mah={224} style={{ overflowY: 'auto' }}>
                    {optionItems.length === 0 ? (
                        <Combobox.Empty>Nothing found</Combobox.Empty>
                    ) : (
                        optionItems
                    )}
                </Combobox.Options>
            </Combobox.Dropdown>
        </Combobox>
    );
}
