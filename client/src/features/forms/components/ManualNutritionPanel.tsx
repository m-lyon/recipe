import { useEffect, useState } from 'react';
import { SimpleGrid, Stack, Text } from '@chakra-ui/react';
import { Box, HStack, Radio, RadioGroup } from '@chakra-ui/react';

import { FloatingLabelInput } from '@recipe/common/components';

import { ClearSelectionButton } from './UsdaSearchPanel';
import { kcalMismatch, perGramFrom } from '../utils/nutrition';
import { NutritionSelection, SourcePanelProps } from './nutritionTypes';
import { MeasureForDensity, gramsPerMillilitre } from '../utils/nutrition';

const FIELDS = [
    { key: 'calories', label: 'Calories (kcal)' },
    { key: 'protein', label: 'Protein (g)' },
    { key: 'carbs', label: 'Carbs (g)' },
    { key: 'fat', label: 'Fat (g)' },
] as const;
type Field = (typeof FIELDS)[number]['key'];

const EMPTY: Record<Field, string> = { calories: '', protein: '', carbs: '', fat: '' };

export interface ManualNutritionPanelProps extends SourcePanelProps {
    /** The ingredient's measures, saved and staged, to convert per 100 ml to grams. */
    measures: MeasureForDensity[];
    /** The prep method of the record, which the volume measure must share. */
    prepMethodId: string | null;
    /** "lime" or "lime, juiced", for messages. */
    targetName: string;
}

export function ManualNutritionPanel(props: ManualNutritionPanelProps) {
    const { idPrefix, ingredientId, disabled, active, onSelect } = props;
    const { measures, prepMethodId, targetName } = props;
    const [values, setValues] = useState(EMPTY);
    const [per, setPer] = useState<'100g' | '100ml'>('100g');
    const [sourceName, setSourceName] = useState('');

    const reset = () => {
        setValues(EMPTY);
        setPer('100g');
        setSourceName('');
    };

    useEffect(reset, [ingredientId]);

    useEffect(() => {
        if (!active) reset();
    }, [active]);

    const parsed = Object.fromEntries(
        FIELDS.map(({ key }) => {
            const text = values[key].trim();
            return [key, /^\d+(\.\d+)?$/.test(text) ? Number(text) : null];
        })
    ) as Record<Field, number | null>;
    const complete = FIELDS.every(({ key }) => parsed[key] !== null);
    const started = FIELDS.some(({ key }) => values[key].trim() !== '') || sourceName.trim() !== '';
    const mismatch = complete ? kcalMismatch(parsed as Record<Field, number>) : null;
    const density = per === '100ml' ? gramsPerMillilitre(measures, prepMethodId) : null;
    const noDensity = per === '100ml' && density === null;

    let selection: NutritionSelection | null = null;
    if (complete && !noDensity) {
        const perGram = perGramFrom(parsed as Record<Field, number>);
        const scale = density === null ? 1 : 1 / density;
        selection = {
            source: 'manual',
            usdaFdcId: null,
            openFoodFactsBarcode: null,
            sourceName: sourceName.trim() || null,
            perGram: {
                calories: perGram.calories * scale,
                protein: perGram.protein * scale,
                carbs: perGram.carbs * scale,
                fat: perGram.fat * scale,
            },
            portions: [],
        };
    }
    const selectionKey = JSON.stringify(selection);

    useEffect(() => {
        if (active) onSelect(selection);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [active, selectionKey]);

    return (
        <Stack spacing={4} fontWeight='normal'>
            <RadioGroup
                value={per}
                onChange={(value) => setPer(value as '100g' | '100ml')}
                isDisabled={disabled}
                aria-label='Values per'
            >
                <HStack spacing='12px'>
                    <Radio value='100g'>per 100 g</Radio>
                    <Radio value='100ml'>per 100 ml</Radio>
                </HStack>
            </RadioGroup>
            <SimpleGrid columns={2} spacingX={2} spacingY={4}>
                {FIELDS.map(({ key, label }) => (
                    <Box key={key}>
                        <FloatingLabelInput
                            id={`${idPrefix}-manual-${key}`}
                            label={label}
                            type='number'
                            inputMode='decimal'
                            min={0}
                            value={values[key]}
                            isInvalid={false}
                            isDisabled={disabled}
                            onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
                        />
                    </Box>
                ))}
            </SimpleGrid>
            <FloatingLabelInput
                id={`${idPrefix}-manual-source`}
                label='Source'
                value={sourceName}
                isInvalid={false}
                isDisabled={disabled}
                onChange={(e) => setSourceName(e.target.value)}
            />
            {started && !complete && (
                <Text fontSize='sm' color='gray.500'>
                    Enter all four values to use them.
                </Text>
            )}
            {mismatch && (
                <Text fontSize='sm' color='orange.600'>
                    {mismatch}. Check that each value is in the right field.
                </Text>
            )}
            {noDensity && (
                <Text fontSize='sm' color='orange.600'>
                    {targetName} has no volume measure, so millilitres cannot be converted to grams.
                    Add one in the measures list below, from a weighed volume such as 1 tablespoon,
                    or enter the values per 100 g.
                </Text>
            )}
            {started && (
                <ClearSelectionButton disabled={disabled} onClear={reset} label='Clear values' />
            )}
        </Stack>
    );
}
