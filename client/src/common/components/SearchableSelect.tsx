import { IconType } from 'react-icons';
import { matchSorter } from 'match-sorter';
import { useEffect, useState } from 'react';
import { Combobox, Group, Text, TextInput, useCombobox } from '@mantine/core';

import classes from './SearchableSelect.module.css';

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
    placeholder,
    label,
    disabled,
    'aria-label': ariaLabel,
}: Props) {
    const combobox = useCombobox({
        onDropdownClose: () => combobox.resetSelectedOption(),
    });

    const [search, setSearch] = useState(options.find((opt) => opt.value === value)?.label ?? '');

    // Sync the search text when the external value or options change
    useEffect(() => {
        const selected = options.find((opt) => opt.value === value) ?? null;
        setSearch(selected?.label ?? '');
    }, [value, options]);

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
                    classNames={{ input: classes.input }}
                    rightSection={<Combobox.Chevron />}
                    rightSectionPointerEvents='none'
                    placeholder={placeholder}
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
                        setSearch(options.find((opt) => opt.value === value)?.label ?? '');
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
