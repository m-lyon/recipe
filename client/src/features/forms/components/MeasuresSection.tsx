import { CloseIcon } from '@chakra-ui/icons';
import { useMutation, useQuery } from '@apollo/client';
import { NumberInput, NumberInputField } from '@chakra-ui/react';
import { forwardRef, useCallback, useImperativeHandle, useMemo, useState } from 'react';
import { Box, Button, Collapse, HStack, IconButton, Stack, Text, Wrap } from '@chakra-ui/react';

import { useErrorToast } from '@recipe/common/hooks';
import { MacroNutrients } from '@recipe/utils/nutrition';
import { SearchableSelect } from '@recipe/common/components';
import { GET_INGREDIENT_COMPONENTS } from '@recipe/graphql/queries/recipe';
import { GET_INGREDIENT_MEASURES } from '@recipe/graphql/queries/nutritionalInfo';
import { CREATE_INGREDIENT_MEASURE } from '@recipe/graphql/mutations/ingredientMeasure';
import { REMOVE_INGREDIENT_MEASURE } from '@recipe/graphql/mutations/ingredientMeasure';

import { UsdaPortion } from './UsdaLinkSection';
import { MeasureDraft, suggestFromPortion } from '../utils/portions';

export interface MeasuresSectionProps {
    ingredientId?: string;
    /** USDA portions of the linked item, offered as one-click rows. */
    portions: UsdaPortion[];
    /** Per-gram macros, so each row can show its calories. Display only. */
    perGram: MacroNutrients | null;
    disabled?: boolean;
}

/** Saves rows staged before the ingredient existed, once it has a real id. */
export interface MeasuresSectionHandle {
    commitPendingMeasures: (ingredientId: string) => Promise<void>;
}

interface Row {
    key: string;
    measureId?: string;
    draft: MeasureDraft;
}

function round1(n: number): string {
    return n.toFixed(1).replace(/\.0$/, '');
}

function sameKey(a: MeasureDraft, b: MeasureDraft): boolean {
    return a.unitId === b.unitId && a.sizeId === b.sizeId && a.prepMethodId === b.prepMethodId;
}

/**
 * The weights that let volume and count quantities of an ingredient reach grams. Most rows
 * are a unit and a weight; size and prep method narrow a row only when the ingredient
 * really varies along them.
 */
export const MeasuresSection = forwardRef<MeasuresSectionHandle, MeasuresSectionProps>(
    function MeasuresSection(props, ref) {
        const { ingredientId, portions, perGram, disabled } = props;
        const toast = useErrorToast();
        const { data: components } = useQuery(GET_INGREDIENT_COMPONENTS);
        const { data: measureData } = useQuery(GET_INGREDIENT_MEASURES, {
            variables: { ingredientIds: ingredientId ? [ingredientId] : [] },
            skip: !ingredientId,
        });
        const [staged, setStaged] = useState<Row[]>([]);
        const [quantity, setQuantity] = useState('1');
        const [grams, setGrams] = useState('');
        const [unitId, setUnitId] = useState<string | null>(null);
        const [sizeId, setSizeId] = useState<string | null>(null);
        const [prepMethodId, setPrepMethodId] = useState<string | null>(null);
        const [moreSpecific, setMoreSpecific] = useState(false);

        const refetchQueries = [GET_INGREDIENT_MEASURES, 'GetRecipeNutrition'];
        const onError = (error: Error) =>
            toast({ title: 'Error saving measure', description: error.message, position: 'top' });
        const [createMeasure] = useMutation(CREATE_INGREDIENT_MEASURE, { refetchQueries });
        const [removeMeasure] = useMutation(REMOVE_INGREDIENT_MEASURE, {
            refetchQueries,
            onError,
        });

        const units = useMemo(() => components?.units ?? [], [components]);
        const sizes = useMemo(() => components?.sizes ?? [], [components]);
        const prepMethods = useMemo(() => components?.prepMethods ?? [], [components]);
        const unitsById = new Map(units.map((u) => [u._id, u]));
        const sizesById = new Map(sizes.map((s) => [s._id, s.value]));
        const prepById = new Map(prepMethods.map((p) => [p._id, p.value]));

        const saved: Row[] = (measureData?.ingredientMeasuresByIngredientIds ?? []).map((m) => ({
            key: m._id,
            measureId: m._id,
            draft: {
                unitId: m.unit._id,
                sizeId: m.size?._id ?? null,
                prepMethodId: m.prepMethod?._id ?? null,
                grams: m.grams,
            },
        }));
        const rows = ingredientId ? saved : staged;

        const suggestions = portions
            .map((portion) => suggestFromPortion(portion, units, sizes, prepMethods))
            .filter((s) => s != null)
            .filter((s) => !s.draft || !rows.some((row) => sameKey(row.draft, s.draft!)));

        const addRow = async (draft: MeasureDraft) => {
            if (rows.some((row) => sameKey(row.draft, draft))) {
                onError(new Error('A measure for this unit, size and prep method already exists.'));
                return;
            }
            if (!ingredientId) {
                setStaged((s) => [...s, { key: crypto.randomUUID(), draft }]);
                return;
            }
            const result = await createMeasure({
                variables: {
                    record: {
                        ingredient: ingredientId,
                        unit: draft.unitId,
                        size: draft.sizeId,
                        prepMethod: draft.prepMethodId,
                        grams: draft.grams,
                    },
                },
            }).catch((error: Error) => {
                onError(error);
                return null;
            });
            if (result?.errors?.length) onError(new Error(result.errors[0].message));
        };

        const handleAdd = () => {
            const qty = parseFloat(quantity);
            const weight = parseFloat(grams);
            if (!unitId || !(qty > 0) || !(weight > 0)) {
                onError(new Error('Enter a quantity, a unit and a weight greater than 0.'));
                return;
            }
            // Entered as written on the packet ("2 tbsp = 27 g"), stored per one unit.
            addRow({ unitId, sizeId, prepMethodId, grams: weight / qty });
            setQuantity('1');
            setGrams('');
            setSizeId(null);
            setPrepMethodId(null);
        };

        const handleRemove = (row: Row) => {
            if (row.measureId) {
                removeMeasure({ variables: { id: row.measureId } });
            } else {
                setStaged((s) => s.filter((r) => r.key !== row.key));
            }
        };

        const commitPendingMeasures = useCallback(
            async (newIngredientId: string) => {
                for (const row of staged) {
                    const result = await createMeasure({
                        variables: {
                            record: {
                                ingredient: newIngredientId,
                                unit: row.draft.unitId,
                                size: row.draft.sizeId,
                                prepMethod: row.draft.prepMethodId,
                                grams: row.draft.grams,
                            },
                        },
                    });
                    if (result.errors?.length) {
                        throw new Error(result.errors[0].message);
                    }
                }
                setStaged([]);
            },
            [staged, createMeasure]
        );
        useImperativeHandle(ref, () => ({ commitPendingMeasures }), [commitPendingMeasures]);

        const describe = (draft: MeasureDraft) =>
            [
                unitsById.get(draft.unitId)?.longSingular ?? '?',
                draft.sizeId ? sizesById.get(draft.sizeId) : null,
                draft.prepMethodId ? prepById.get(draft.prepMethodId) : null,
            ]
                .filter(Boolean)
                .join(' · ');

        return (
            <Stack spacing={3} fontWeight='normal'>
                <Text fontWeight={500}>Measures</Text>
                {rows.length === 0 && (
                    <Text fontSize='sm' color='gray.500'>
                        No measures yet. Volume and count quantities of this ingredient are not
                        counted until one is added.
                    </Text>
                )}
                {rows.map((row) => {
                    const unit = unitsById.get(row.draft.unitId);
                    return (
                        <HStack
                            key={row.key}
                            fontSize='sm'
                            aria-label={`Measure ${describe(row.draft)}`}
                        >
                            <Text flex={1}>
                                1 {describe(row.draft)} = {round1(row.draft.grams)} g
                            </Text>
                            {unit?.dimension === 'volume' && (
                                <Text color='gray.500'>
                                    {(row.draft.grams / unit.perCanonical).toFixed(2)} g/ml
                                </Text>
                            )}
                            {perGram && (
                                <Text color='gray.500'>
                                    {Math.round(perGram.calories * row.draft.grams)} kcal
                                </Text>
                            )}
                            <IconButton
                                size='xs'
                                variant='ghost'
                                icon={<CloseIcon />}
                                aria-label={`Remove measure ${describe(row.draft)}`}
                                isDisabled={disabled}
                                onClick={() => handleRemove(row)}
                            />
                        </HStack>
                    );
                })}
                <HStack align='flex-end'>
                    <NumberInput
                        size='sm'
                        min={0}
                        value={quantity}
                        onChange={setQuantity}
                        isDisabled={disabled}
                        maxW='5em'
                    >
                        <NumberInputField aria-label='Measure quantity' />
                    </NumberInput>
                    <Box flex={1}>
                        <SearchableSelect
                            label='Unit'
                            aria-label='Measure unit'
                            options={units
                                .filter((u) => u.dimension !== 'mass')
                                .map((u) => ({ value: u._id, label: u.longSingular }))}
                            value={unitId}
                            onChange={setUnitId}
                            disabled={disabled}
                        />
                    </Box>
                    <Text fontSize='sm'>=</Text>
                    <NumberInput
                        size='sm'
                        min={0}
                        value={grams}
                        onChange={setGrams}
                        isDisabled={disabled}
                        maxW='6em'
                    >
                        <NumberInputField aria-label='Measure grams' />
                    </NumberInput>
                    <Text fontSize='sm'>g</Text>
                </HStack>
                <Button
                    size='xs'
                    variant='link'
                    alignSelf='flex-start'
                    onClick={() => setMoreSpecific((open) => !open)}
                    isDisabled={disabled}
                >
                    more specific…
                </Button>
                <Collapse in={moreSpecific} animateOpacity>
                    <HStack>
                        <SearchableSelect
                            label='Size'
                            aria-label='Measure size'
                            options={sizes.map((s) => ({ value: s._id, label: s.value }))}
                            value={sizeId}
                            onChange={setSizeId}
                            disabled={disabled}
                        />
                        <SearchableSelect
                            label='Prep method'
                            aria-label='Measure prep method'
                            options={prepMethods.map((p) => ({ value: p._id, label: p.value }))}
                            value={prepMethodId}
                            onChange={setPrepMethodId}
                            disabled={disabled}
                        />
                    </HStack>
                </Collapse>
                <Button
                    size='sm'
                    alignSelf='flex-start'
                    onClick={handleAdd}
                    isDisabled={disabled}
                    aria-label='Add measure'
                >
                    + Add measure
                </Button>
                {suggestions.length > 0 && (
                    <Stack spacing={1}>
                        <Text fontSize='sm' color='gray.600'>
                            From USDA:
                        </Text>
                        <Wrap>
                            {suggestions.map((suggestion, index) =>
                                suggestion.draft ? (
                                    <Button
                                        key={index}
                                        size='xs'
                                        variant='outline'
                                        isDisabled={disabled}
                                        onClick={() => addRow(suggestion.draft!)}
                                        aria-label={`Add USDA measure ${suggestion.label}`}
                                    >
                                        {suggestion.label} +
                                    </Button>
                                ) : (
                                    <Text key={index} fontSize='xs' color='gray.500'>
                                        {suggestion.label} — {suggestion.reason}
                                    </Text>
                                )
                            )}
                        </Wrap>
                    </Stack>
                )}
            </Stack>
        );
    }
);
