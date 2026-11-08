import { useState } from 'react';
import { Stack, Text } from '@chakra-ui/react';
import { Button, HStack, Input, InputGroup, InputRightAddon } from '@chakra-ui/react';
import { NumberInput, NumberInputField, Radio, RadioGroup, Select } from '@chakra-ui/react';

import { isValidQuantity } from '@recipe/utils/nutritionOverride';

type Mode = 'all' | NutritionOverride['mode'];

interface Props {
    override: NutritionOverride | null;
    /** The line's own quantity: a line without one has no share to count. */
    hasQuantity: boolean;
    /** The unit a set amount starts in. */
    defaultUnit: UnitChoice | null;
    units: UnitChoice[];
    onApply: (override: NutritionOverride | null) => void;
}
export function NutritionOverrideForm(props: Props) {
    const { override, hasQuantity, defaultUnit, units, onApply } = props;
    const [mode, setMode] = useState<Mode>(override?.mode ?? (hasQuantity ? 'all' : 'amount'));
    const [percent, setPercent] = useState(override?.percent?.toString() ?? '');
    const [quantity, setQuantity] = useState(override?.quantity ?? '');
    const [unitId, setUnitId] = useState(override?.unit?._id ?? defaultUnit?._id ?? '');
    const unit = units.find((u) => u._id === unitId) ?? null;

    const percentValue = Number(percent);
    const valid =
        mode === 'all' ||
        mode === 'negligible' ||
        (mode === 'share' && percent !== '' && percentValue >= 0 && percentValue <= 100) ||
        (mode === 'amount' && isValidQuantity(quantity) && unit !== null);

    const apply = () => {
        if (!valid) return;
        switch (mode) {
            case 'all':
                return onApply(null);
            case 'share':
                return onApply({ mode, percent: percentValue, quantity: null, unit: null });
            case 'amount':
                return onApply({ mode, percent: null, quantity: quantity.trim(), unit });
            case 'negligible':
                return onApply({ mode, percent: null, quantity: null, unit: null });
        }
    };

    return (
        <Stack
            as='form'
            spacing={3}
            onSubmit={(e) => {
                e.preventDefault();
                apply();
            }}
        >
            <RadioGroup value={mode} onChange={(value) => setMode(value as Mode)}>
                <Stack spacing={2}>
                    <Radio value='all' colorScheme='teal'>
                        {hasQuantity ? 'Count all of it' : 'Leave it uncounted'}
                    </Radio>
                    {hasQuantity && (
                        <Radio value='share' colorScheme='teal'>
                            Count part of it
                        </Radio>
                    )}
                    {mode === 'share' && (
                        <InputGroup size='sm' pl={6} maxW='160px'>
                            <NumberInput
                                value={percent}
                                onChange={(value) => setPercent(value)}
                                min={0}
                                max={100}
                                size='sm'
                            >
                                <NumberInputField aria-label='Percentage to count' autoFocus />
                            </NumberInput>
                            <InputRightAddon>%</InputRightAddon>
                        </InputGroup>
                    )}
                    <Radio value='amount' colorScheme='teal'>
                        Count a set amount
                    </Radio>
                    {mode === 'amount' && (
                        <HStack pl={6} spacing={2}>
                            <Input
                                size='sm'
                                maxW='80px'
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                placeholder='1/4'
                                aria-label='Amount to count'
                                isInvalid={quantity !== '' && !isValidQuantity(quantity)}
                                autoFocus
                            />
                            <Select
                                size='sm'
                                value={unitId}
                                onChange={(e) => setUnitId(e.target.value)}
                                aria-label='Unit of the amount to count'
                            >
                                {units.map((choice) => (
                                    <option key={choice._id} value={choice._id}>
                                        {choice.longPlural}
                                    </option>
                                ))}
                            </Select>
                        </HStack>
                    )}
                    <Radio value='negligible' colorScheme='teal'>
                        Too small to count
                    </Radio>
                </Stack>
            </RadioGroup>
            {mode === 'negligible' && (
                <Text fontSize='sm' color='gray.500'>
                    It counts as nothing, and is not listed as uncounted.
                </Text>
            )}
            <Button type='submit' size='sm' colorScheme='teal' isDisabled={!valid}>
                Apply
            </Button>
        </Stack>
    );
}
