import { TbAlertTriangle } from 'react-icons/tb';
import { ActionIcon, Group, Radio, Stack, Text, Tooltip } from '@mantine/core';

import { UsdaFoodItemQuery } from '@recipe/graphql/generated';

export type UsdaPortion = NonNullable<UsdaFoodItemQuery['usdaFoodItem']>['portions'][number];

export interface UsdaPortionPickerProps {
    /** Already filtered to kind ITEM by the caller. */
    portions: UsdaPortion[];
    selected: string | null;
    loading?: boolean;
    disabled?: boolean;
    onSelect: (portion: UsdaPortion) => void;
}

/** Lets the reader choose which USDA portion means "one" of a countable ingredient.
 *  Nothing is preselected: a sole clean candidate can still be wrong (banana's only
 *  unqualified portion is an NLEA labelling serving), so the reader always chooses. */
export function UsdaPortionPicker(props: UsdaPortionPickerProps) {
    const { portions, selected, loading, disabled, onSelect } = props;

    if (loading) {
        return (
            <Text size='sm' c='dimmed'>
                Loading portion data…
            </Text>
        );
    }

    if (portions.length === 0) {
        return (
            <Text size='sm' c='dimmed'>
                This USDA record has no per-item portion, so per-unit values cannot be derived from
                it. Enter them by hand below.
            </Text>
        );
    }

    return (
        <Stack gap='xs'>
            <Text size='sm' fw={500}>
                Portion for one unit
            </Text>
            <Radio.Group
                value={selected ?? ''}
                onChange={(value) => {
                    const portion = portions.find((p) => p.description === value);
                    if (portion) onSelect(portion);
                }}
                aria-label='USDA portion for one unit'
            >
                <Stack gap={4}>
                    {portions.map((portion) => (
                        <Radio
                            key={portion.description}
                            value={portion.description}
                            disabled={disabled}
                            label={
                                <Group gap={6}>
                                    <Text component='span' size='sm'>
                                        {portion.description} = {portion.gramWeight} g
                                    </Text>
                                    {portion.ambiguous && (
                                        <Tooltip label='Potentially inaccurate' withArrow>
                                            <ActionIcon
                                                variant='transparent'
                                                color='orange'
                                                size='xs'
                                                component='span'
                                                display='inline-flex'
                                                aria-label='Potentially inaccurate portion'
                                            >
                                                <TbAlertTriangle />
                                            </ActionIcon>
                                        </Tooltip>
                                    )}
                                </Group>
                            }
                        />
                    ))}
                </Stack>
            </Radio.Group>
        </Stack>
    );
}
