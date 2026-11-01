import { useEffect, useState } from 'react';
import { SimpleGrid, Stack, Text } from '@chakra-ui/react';
import { Box, Button, HStack, Radio, RadioGroup } from '@chakra-ui/react';

import { FloatingLabelInput } from '@recipe/common/components';

import { onEnter } from './UsdaSearchPanel';
import { SourcePanelProps } from './nutritionTypes';
import { kcalMismatch, perGramFrom } from '../utils/nutrition';
import { MeasureForDensity, gramsPerMillilitre } from '../utils/nutrition';

const FIELDS = [
    { key: 'calories', label: 'Calories (kcal)' },
    { key: 'protein', label: 'Protein (g)' },
    { key: 'carbs', label: 'Carbs (g)' },
    { key: 'fat', label: 'Fat (g)' },
] as const;
type Field = (typeof FIELDS)[number]['key'];

const EMPTY: Record<Field, string> = { calories: '', protein: '', carbs: '', fat: '' };

export interface ManualNutritionPanelProps extends Omit<SourcePanelProps, 'onPreview'> {
    /** The ingredient's measures, saved and staged, to convert per 100 ml to grams. */
    measures: MeasureForDensity[];
    /** The prep method of the record, which the volume measure must share. */
    prepMethodId: string | null;
    /** "lime" or "lime, juiced", for messages. */
    targetName: string;
}

/** Values typed from a pack label or another source, per 100 g or per 100 ml. */
export function ManualNutritionPanel(props: ManualNutritionPanelProps) {
    const { idPrefix, ingredientId, disabled, onLink, measures, prepMethodId, targetName } = props;
    const [values, setValues] = useState(EMPTY);
    const [per, setPer] = useState<'100g' | '100ml'>('100g');
    const [sourceName, setSourceName] = useState('');
    const [showInvalid, setShowInvalid] = useState(false);

    useEffect(() => {
        setValues(EMPTY);
        setPer('100g');
        setSourceName('');
        setShowInvalid(false);
    }, [ingredientId]);

    // Four non-negative numbers, as `recipe nutrition set` takes them.
    const parsed = Object.fromEntries(
        FIELDS.map(({ key }) => {
            const text = values[key].trim();
            return [key, /^\d+(\.\d+)?$/.test(text) ? Number(text) : null];
        })
    ) as Record<Field, number | null>;
    const complete = FIELDS.every(({ key }) => parsed[key] !== null);
    const mismatch = complete ? kcalMismatch(parsed as Record<Field, number>) : null;
    const density = per === '100ml' ? gramsPerMillilitre(measures, prepMethodId) : null;
    const noDensity = per === '100ml' && density === null;

    const handleUse = () => {
        if (!complete) {
            setShowInvalid(true);
            return;
        }
        if (noDensity) return;
        const perGram = perGramFrom(parsed);
        // The values are per millilitre; divide by the grams in a millilitre.
        const scale = density === null ? 1 : 1 / density;
        onLink({
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
        });
    };

    return (
        <Stack spacing={4} fontWeight='normal'>
            <RadioGroup
                value={per}
                onChange={(value) => setPer(value as '100g' | '100ml')}
                isDisabled={disabled}
                aria-label='Values per'
            >
                <HStack spacing={4}>
                    <Radio value='100g'>per 100 g</Radio>
                    <Radio value='100ml'>per 100 ml</Radio>
                </HStack>
            </RadioGroup>
            <SimpleGrid columns={2} spacing={2}>
                {FIELDS.map(({ key, label }) => (
                    <Box key={key}>
                        <FloatingLabelInput
                            id={`${idPrefix}-manual-${key}`}
                            label={label}
                            type='number'
                            inputMode='decimal'
                            min={0}
                            value={values[key]}
                            isInvalid={showInvalid && parsed[key] === null}
                            isDisabled={disabled}
                            onChange={(e) => {
                                setValues((v) => ({ ...v, [key]: e.target.value }));
                                setShowInvalid(false);
                            }}
                            onKeyDown={onEnter(handleUse)}
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
                onKeyDown={onEnter(handleUse)}
            />
            {showInvalid && (
                <Text fontSize='sm' color='red.500'>
                    Enter four numbers of 0 or more.
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
            <Button
                size='sm'
                alignSelf='flex-start'
                onClick={handleUse}
                isDisabled={disabled || noDensity}
                aria-label='Use entered nutritional data'
            >
                Use these values
            </Button>
        </Stack>
    );
}
