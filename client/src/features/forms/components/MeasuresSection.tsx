import { CloseIcon } from '@chakra-ui/icons';
import { Stack, Text, Wrap } from '@chakra-ui/react';
import { useMutation, useQuery } from '@apollo/client';
import { Box, Button, Checkbox, HStack, IconButton, Skeleton } from '@chakra-ui/react';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from 'react';

import { useErrorToast } from '@recipe/common/hooks';
import { MacroNutrients } from '@recipe/utils/nutrition';
import { GET_INGREDIENT_COMPONENTS } from '@recipe/graphql/queries/recipe';
import { FloatingLabelInput, SearchableSelect } from '@recipe/common/components';
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
    /**
     * Names from the saved measure. The reader may not see every unit or size in the
     * component lists (they hold only the reader's and admins' items), so saved rows carry
     * their own.
     */
    saved?: {
        unit: { longSingular: string; dimension: string; perCanonical: number };
        size: string | null;
        prepMethod: string | null;
    };
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
        const { data: measureData, loading: measuresLoading } = useQuery(GET_INGREDIENT_MEASURES, {
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

        // A half-entered measure belongs to the ingredient it was typed for.
        useEffect(() => {
            setQuantity('1');
            setGrams('');
            setUnitId(null);
            setSizeId(null);
            setPrepMethodId(null);
            setMoreSpecific(false);
        }, [ingredientId]);

        const refetchQueries = [GET_INGREDIENT_MEASURES, 'GetRecipeNutrition'];
        const onError = (error: Error) =>
            toast({ title: 'Error saving measure', description: error.message, position: 'top' });
        const [createMeasure, { loading: creating }] = useMutation(CREATE_INGREDIENT_MEASURE, {
            refetchQueries,
        });
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
            saved: {
                unit: m.unit,
                size: m.size?.value ?? null,
                prepMethod: m.prepMethod?.value ?? null,
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

        // Chakra fades a disabled field to 0.4; plain text has to fade itself to match.
        const dimmed = disabled ? 0.4 : undefined;

        const describe = (row: Row) => {
            const { draft, saved } = row;
            return [
                saved?.unit.longSingular ?? unitsById.get(draft.unitId)?.longSingular ?? '?',
                saved?.size ?? (draft.sizeId ? sizesById.get(draft.sizeId) : null),
                saved?.prepMethod ?? (draft.prepMethodId ? prepById.get(draft.prepMethodId) : null),
            ]
                .filter(Boolean)
                .join(' · ');
        };

        return (
            <Stack spacing={4}>
                <Text opacity={dimmed}>Measures</Text>
                {measuresLoading && (
                    <Stack spacing={3} aria-label='Loading measures'>
                        <Skeleton height='10px' />
                        <Skeleton height='10px' />
                        <Skeleton height='10px' width='40%' />
                    </Stack>
                )}
                {!measuresLoading && rows.length === 0 && (
                    <Text fontSize='sm' color='gray.500' opacity={dimmed}>
                        No measures yet. Volume and count quantities of this ingredient do not count
                        toward nutritional info until a measure is added.
                    </Text>
                )}
                {rows.length > 0 && (
                    <Stack spacing={2}>
                        {rows.map((row) => {
                            const unit = row.saved?.unit ?? unitsById.get(row.draft.unitId);
                            return (
                                <HStack
                                    key={row.key}
                                    fontSize='sm'
                                    aria-label={`Measure ${describe(row)}`}
                                >
                                    <Text flex={1}>
                                        1 {describe(row)} = {round1(row.draft.grams)} g
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
                                        icon={<CloseIcon boxSize={2.5} />}
                                        aria-label={`Remove measure ${describe(row)}`}
                                        isDisabled={disabled}
                                        onClick={() => handleRemove(row)}
                                    />
                                </HStack>
                            );
                        })}
                    </Stack>
                )}
                {/* One box, so the button reads as adding everything inside it. */}
                <Stack
                    as='fieldset'
                    spacing={4}
                    border='1px solid'
                    borderColor={disabled ? 'gray.100' : 'gray.200'}
                    borderRadius='md'
                    px={3}
                    pt={4}
                    pb={3}
                >
                    <Text
                        as='legend'
                        px={1}
                        fontSize='sm'
                        color='gray.400'
                        opacity={dimmed}
                        // Sit the border as low on the text as on the floating input labels.
                        position='relative'
                        top='-2px'
                    >
                        New measure
                    </Text>
                    <HStack spacing={2}>
                        <Box w='6.5em' flexShrink={0}>
                            <FloatingLabelInput
                                id='measure-quantity'
                                label='Quantity'
                                type='number'
                                inputMode='decimal'
                                min={0}
                                value={quantity}
                                isInvalid={false}
                                isDisabled={disabled}
                                onChange={(e) => setQuantity(e.target.value)}
                            />
                        </Box>
                        <Box flex={1} minW={0}>
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
                    </HStack>
                    <Checkbox
                        alignSelf='flex-start'
                        isChecked={moreSpecific}
                        isDisabled={disabled}
                        onChange={(e) => {
                            setMoreSpecific(e.target.checked);
                            // A hidden size or prep method must not narrow the next measure.
                            if (!e.target.checked) {
                                setSizeId(null);
                                setPrepMethodId(null);
                            }
                        }}
                    >
                        Specific size or prep method
                    </Checkbox>
                    {moreSpecific && (
                        <HStack spacing={2}>
                            <Box flex={1} minW={0}>
                                <SearchableSelect
                                    label='Size'
                                    aria-label='Measure size'
                                    options={sizes.map((s) => ({ value: s._id, label: s.value }))}
                                    value={sizeId}
                                    onChange={setSizeId}
                                    disabled={disabled}
                                />
                            </Box>
                            <Box flex={1} minW={0}>
                                <SearchableSelect
                                    label='Prep'
                                    aria-label='Measure prep method'
                                    options={prepMethods.map((p) => ({
                                        value: p._id,
                                        label: p.value,
                                    }))}
                                    value={prepMethodId}
                                    onChange={setPrepMethodId}
                                    disabled={disabled}
                                />
                            </Box>
                        </HStack>
                    )}
                    <FloatingLabelInput
                        id='measure-grams'
                        label='Grams'
                        type='number'
                        inputMode='decimal'
                        min={0}
                        value={grams}
                        isInvalid={false}
                        isDisabled={disabled}
                        onChange={(e) => setGrams(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key !== 'Enter') return;
                            // Add the measure, not save the whole ingredient.
                            e.preventDefault();
                            e.stopPropagation();
                            handleAdd();
                        }}
                    />
                    <Button
                        alignSelf='flex-end'
                        onClick={handleAdd}
                        isDisabled={disabled || measuresLoading}
                        isLoading={creating}
                        aria-label='Add measure'
                    >
                        Add measure
                    </Button>
                </Stack>
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
