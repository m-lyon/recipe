import { useQuery } from '@apollo/client';
import { useShallow } from 'zustand/shallow';
import { TbPlus, TbX } from 'react-icons/tb';
import { ActionIcon, Button, Group, Select, Stack, Text, TextInput } from '@mantine/core';

import { useRecipeStore } from '@recipe/stores';
import { GET_INGREDIENT_COMPONENTS } from '@recipe/graphql/queries/recipe';

/** "g (gram)", or "each (whole batches)" for the hidden count unit. */
function unitLabel(unit: UnitChoice): string {
    return unit.hidden
        ? `${unit.longSingular} (whole batches)`
        : `${unit.shortSingular} (${unit.longSingular})`;
}

/**
 * What a row's unit rules out for the other rows. A mass or volume quantity reads against any
 * row in its dimension, so a mass row rules out every mass unit. A count quantity reads only
 * against its own unit, so "8 slice" and "2 each" can both be given.
 */
function yieldKey(unit: UnitChoice): string {
    return unit.dimension === 'count' ? unit._id : unit.dimension;
}

export function EditableYield() {
    const { rows, isIngredient, addRow, updateRow, removeRow } = useRecipeStore(
        useShallow((state) => ({
            rows: state.yieldRows,
            isIngredient: state.isIngredient,
            addRow: state.addYieldRow,
            updateRow: state.updateYieldRow,
            removeRow: state.removeYieldRow,
        }))
    );
    const { data } = useQuery(GET_INGREDIENT_COMPONENTS);
    const units = data?.units ?? [];

    const choicesFor = (index: number) => {
        const taken = new Set(
            rows
                .filter((_, i) => i !== index)
                .flatMap((row) => (row.unit ? [yieldKey(row.unit)] : []))
        );
        return units
            .filter((unit) => !taken.has(yieldKey(unit)))
            .map((unit) => ({ value: unit._id, label: unitLabel(unit) }));
    };
    const allTaken = new Set(rows.flatMap((row) => (row.unit ? [yieldKey(row.unit)] : [])));
    const canAdd =
        allTaken.size === rows.length && units.some((unit) => !allTaken.has(yieldKey(unit)));

    return (
        <Stack gap='xs' aria-label='Recipe yield'>
            <Group gap='xs'>
                <Text fw={500}>Makes</Text>
                <Text size='sm' c='dimmed'>
                    {isIngredient
                        ? 'Recommended: other recipes use it to count this one.'
                        : 'Optional: how much one batch makes.'}
                </Text>
            </Group>
            {rows.map((row, index) => (
                <Group key={index} gap='xs'>
                    <TextInput
                        placeholder='Quantity'
                        value={row.quantity}
                        onChange={(e) => updateRow(index, { quantity: e.target.value.trim() })}
                        aria-label={`Yield quantity ${index + 1}`}
                        size='xs'
                        w={90}
                    />
                    <Select
                        placeholder='Unit'
                        value={row.unit?._id ?? null}
                        onChange={(id) =>
                            updateRow(index, {
                                unit: units.find((unit) => unit._id === id) ?? null,
                            })
                        }
                        data={choicesFor(index)}
                        aria-label={`Yield unit ${index + 1}`}
                        size='xs'
                        searchable
                        w={200}
                    />
                    <ActionIcon
                        variant='subtle'
                        color='gray'
                        onClick={() => removeRow(index)}
                        aria-label={`Remove yield row ${index + 1}`}
                    >
                        <TbX />
                    </ActionIcon>
                </Group>
            ))}
            {canAdd && (
                <Button
                    variant='subtle'
                    color='gray'
                    size='xs'
                    leftSection={<TbPlus />}
                    onClick={addRow}
                    style={{ alignSelf: 'flex-start' }}
                >
                    Add measure
                </Button>
            )}
        </Stack>
    );
}
