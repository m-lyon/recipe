import { useQuery } from '@apollo/client';
import { useShallow } from 'zustand/shallow';
import { Group, Select, TextInput } from '@mantine/core';

import { useRecipeStore } from '@recipe/stores';
import { useErrorToast } from '@recipe/common/hooks';
import { VALID_NUMBER_REGEX } from '@recipe/utils/number';
import { GET_INGREDIENT_COMPONENTS } from '@recipe/graphql/queries/recipe';

export function EditableYield() {
    const { yieldQuantity, yieldUnit, setYieldQuantity, setYieldUnit } = useRecipeStore(
        useShallow((state) => ({
            yieldQuantity: state.yieldQuantity,
            yieldUnit: state.yieldUnit,
            setYieldQuantity: state.setYieldQuantity,
            setYieldUnit: state.setYieldUnit,
        }))
    );
    const toast = useErrorToast();
    const { data } = useQuery(GET_INGREDIENT_COMPONENTS, { fetchPolicy: 'cache-first' });
    const units = data?.units ?? [];

    const handleQuantityBlur = () => {
        if (yieldQuantity && !VALID_NUMBER_REGEX.test(yieldQuantity)) {
            toast({
                title: 'Invalid yield quantity',
                description: 'Use formats like 1, 1/2, 1.5, 1-2',
            });
            setYieldQuantity(null);
        }
    };

    return (
        <Group gap='xs'>
            <TextInput
                placeholder='Yield qty'
                value={yieldQuantity ?? ''}
                onChange={(e) => setYieldQuantity(e.target.value || null)}
                onBlur={handleQuantityBlur}
                aria-label='Edit yield quantity'
                size='xs'
                w={80}
            />
            <Select
                placeholder='Unit'
                value={yieldUnit?._id ?? null}
                onChange={(id) => setYieldUnit(units.find((u) => u._id === id) ?? null)}
                data={units.map((u) => ({
                    value: u._id,
                    label: `${u.shortSingular} (${u.longSingular})`,
                }))}
                aria-label='Edit yield unit'
                size='xs'
                clearable
                w={120}
            />
        </Group>
    );
}
