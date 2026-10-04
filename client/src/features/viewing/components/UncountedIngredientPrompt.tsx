import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { Button, Group, NumberInput, Radio, Stack, Text } from '@mantine/core';

import { UncountedIngredient, describeOneUnit } from '@recipe/utils/nutrition';
import { CREATE_INGREDIENT_MEASURE } from '@recipe/graphql/mutations/ingredientMeasure';

interface Option {
    label: string;
    sizeId: string | null;
    prepMethodId: string | null;
}

/** How specific to save a weight: least specific first, so one answer covers most lines. */
function specificityOptions(item: RecipeIngredientView): Option[] {
    const unit = item.unit!;
    const name = item.ingredient.__typename === 'Ingredient' ? item.ingredient.name : '';
    const size = item.size;
    const prep = item.prepMethod;
    const options: Option[] = [
        {
            label: describeOneUnit(unit, name).replace(/^1 /, ''),
            sizeId: null,
            prepMethodId: null,
        },
    ];
    if (size) {
        options.push({
            label: describeOneUnit(unit, name, size.value).replace(/^1 /, ''),
            sizeId: size._id,
            prepMethodId: null,
        });
    }
    if (prep) {
        options.push({
            label: describeOneUnit(unit, name, size?.value, prep.value).replace(/^1 /, ''),
            sizeId: size?._id ?? null,
            prepMethodId: prep._id,
        });
    }
    return options;
}

interface Props {
    uncounted: UncountedIngredient;
    onSaved: () => void;
}
/**
 * Turns an uncounted recipe line into a measure: the line already carries the unit, size
 * and prep method, so the only questions are the weight and how specific to save it.
 */
export function UncountedIngredientPrompt(props: Props) {
    const { uncounted, onSaved } = props;
    const { item } = uncounted;
    const options = specificityOptions(item);
    const [choice, setChoice] = useState('0');
    const [grams, setGrams] = useState<number | string>('');
    const [error, setError] = useState<string | null>(null);
    const [createMeasure, { loading }] = useMutation(CREATE_INGREDIENT_MEASURE, {
        onCompleted: () => {
            setError(null);
            onSaved();
        },
        onError: (err) => setError(err.message),
    });
    const full = options[options.length - 1].label;

    const handleSave = () => {
        const option = options[Number(choice)];
        if (typeof grams !== 'number' || grams <= 0) {
            setError('Enter a weight greater than 0.');
            return;
        }
        createMeasure({
            variables: {
                record: {
                    ingredient: item.ingredient._id,
                    unit: item.unit!._id,
                    size: option.sizeId,
                    prepMethod: option.prepMethodId,
                    grams,
                },
            },
        });
    };

    return (
        <Stack gap={4} mt='xs' aria-label={`Add a weight for ${full}`}>
            <Text size='sm'>How much does 1 {full} weigh?</Text>
            <Group gap='xs' align='center'>
                <NumberInput
                    size='xs'
                    w={90}
                    min={0}
                    value={grams}
                    onChange={setGrams}
                    aria-label={`Grams in 1 ${full}`}
                    suffix=' g'
                />
                {options.length > 1 && (
                    <Radio.Group value={choice} onChange={setChoice}>
                        <Group gap='xs'>
                            {options.map((option, index) => (
                                <Radio
                                    key={option.label}
                                    size='xs'
                                    value={String(index)}
                                    label={`"${option.label}"`}
                                />
                            ))}
                        </Group>
                    </Radio.Group>
                )}
                <Button size='xs' variant='light' loading={loading} onClick={handleSave}>
                    Save
                </Button>
            </Group>
            {error && (
                <Text size='xs' c='red'>
                    {error}
                </Text>
            )}
        </Stack>
    );
}
