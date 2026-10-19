import { CloseIcon } from '@chakra-ui/icons';
import { Stack, Text, Wrap } from '@chakra-ui/react';
import { ApolloCache, useMutation, useQuery } from '@apollo/client';
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

/** Added and removed rows are staged; the parent saves them with the ingredient, once it
 *  has an id. Throws when a change could not be saved. */
export interface MeasuresSectionHandle {
    commitChanges: (ingredientId: string) => Promise<void>;
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
        // Saved measures the reader removed, deleted only when the ingredient is saved.
        const [removed, setRemoved] = useState<ReadonlySet<string>>(new Set());
        // Set by a rejected "Add measure", so the fields at fault show as invalid.
        const [showInvalid, setShowInvalid] = useState(false);
        const [quantity, setQuantity] = useState('1');
        const [grams, setGrams] = useState('');
        const [unitId, setUnitId] = useState<string | null>(null);
        const [sizeId, setSizeId] = useState<string | null>(null);
        const [prepMethodId, setPrepMethodId] = useState<string | null>(null);
        const [moreSpecific, setMoreSpecific] = useState(false);

        const resetNewMeasure = () => {
            setQuantity('1');
            setGrams('');
            setUnitId(null);
            setSizeId(null);
            setPrepMethodId(null);
            setMoreSpecific(false);
            setShowInvalid(false);
        };

        // A half-entered or unsaved measure belongs to the ingredient it was made for.
        useEffect(() => {
            resetNewMeasure();
            setStaged([]);
            setRemoved(new Set());
        }, [ingredientId]);

        // Measure lists are root fields, not normalized; evict them so every page refetches.
        const update = (cache: ApolloCache<unknown>) => {
            cache.evict({ id: 'ROOT_QUERY', fieldName: 'ingredientMeasuresByIngredientIds' });
            cache.gc();
        };
        const onError = (error: Error) =>
            toast({ title: 'Error saving measure', description: error.message, position: 'top' });
        // Run only by commitChanges, which reports a failure to the caller.
        const [createMeasure] = useMutation(CREATE_INGREDIENT_MEASURE, { update });
        const [removeMeasure] = useMutation(REMOVE_INGREDIENT_MEASURE, { update });

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
        const rows = [...saved.filter((row) => !removed.has(row.measureId!)), ...staged];

        const suggestions = portions
            .map((portion) => suggestFromPortion(portion, units, sizes, prepMethods))
            .filter((s) => s != null)
            .filter((s) => !s.draft || !rows.some((row) => sameKey(row.draft, s.draft!)));

        /** Stages a row, and says whether it was added. */
        const addRow = (draft: MeasureDraft): boolean => {
            if (rows.some((row) => sameKey(row.draft, draft))) {
                onError(new Error('A measure for this unit, size and prep method already exists.'));
                return false;
            }
            // Removing a saved row and adding it back keeps the saved one.
            const restored = saved.find(
                (row) => removed.has(row.measureId!) && sameKey(row.draft, draft)
            );
            if (restored && restored.draft.grams === draft.grams) {
                setRemoved((r) => new Set([...r].filter((id) => id !== restored.measureId)));
                return true;
            }
            setStaged((s) => [...s, { key: crypto.randomUUID(), draft }]);
            return true;
        };

        const qty = parseFloat(quantity);
        const weight = parseFloat(grams);
        const invalid = {
            quantity: showInvalid && !(qty > 0),
            unit: showInvalid && !unitId,
            grams: showInvalid && !(weight > 0),
        };

        const handleAdd = () => {
            if (!unitId || !(qty > 0) || !(weight > 0)) {
                setShowInvalid(true);
                onError(new Error('Enter a quantity, a unit and a weight greater than 0.'));
                return;
            }
            // Entered as written on the packet ("2 tbsp = 27 g"), stored per one unit.
            // Keep what was typed when it is rejected, so it can be corrected.
            if (!addRow({ unitId, sizeId, prepMethodId, grams: weight / qty })) return;
            resetNewMeasure();
        };

        const handleRemove = (row: Row) => {
            if (row.measureId) {
                setRemoved((r) => new Set(r).add(row.measureId!));
            } else {
                setStaged((s) => s.filter((r) => r.key !== row.key));
            }
        };

        const commitChanges = useCallback(
            async (targetIngredientId: string) => {
                // Removals first, so a row removed and added again with a new weight
                // does not collide with the saved one.
                for (const measureId of removed) {
                    const result = await removeMeasure({ variables: { id: measureId } });
                    if (result.errors?.length) {
                        throw new Error(result.errors[0].message);
                    }
                    setRemoved((r) => {
                        const next = new Set(r);
                        next.delete(measureId);
                        return next;
                    });
                }
                for (const row of staged) {
                    const result = await createMeasure({
                        variables: {
                            record: {
                                ingredient: targetIngredientId,
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
                    setStaged((s) => s.filter((r) => r.key !== row.key));
                }
            },
            [removed, staged, createMeasure, removeMeasure]
        );
        useImperativeHandle(ref, () => ({ commitChanges }), [commitChanges]);

        // Nothing can be added or removed until the saved measures are known.
        const inactive = disabled || measuresLoading;
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
        // One format for saved rows and USDA suggestions: "1 cup · chopped = 120 g".
        const describeWithWeight = (row: Row) =>
            `1 ${describe(row)} = ${round1(row.draft.grams)} g`;

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
                {!disabled && !measuresLoading && rows.length === 0 && (
                    <Text fontSize='sm' color='gray.500' fontWeight='normal'>
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
                                    fontWeight='normal'
                                    aria-label={`Measure ${describe(row)}`}
                                >
                                    <Text flex={1}>{describeWithWeight(row)}</Text>
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
                                        isDisabled={inactive}
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
                                value={disabled ? '' : quantity}
                                isInvalid={invalid.quantity}
                                isDisabled={inactive}
                                onChange={(e) => {
                                    setQuantity(e.target.value);
                                    setShowInvalid(false);
                                }}
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
                                onChange={(value) => {
                                    setUnitId(value);
                                    setShowInvalid(false);
                                }}
                                disabled={inactive}
                                invalid={invalid.unit}
                            />
                        </Box>
                    </HStack>
                    <Checkbox
                        alignSelf='flex-start'
                        isChecked={moreSpecific}
                        isDisabled={inactive}
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
                                    disabled={inactive}
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
                                    disabled={inactive}
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
                        isInvalid={invalid.grams}
                        isDisabled={inactive}
                        onChange={(e) => {
                            setGrams(e.target.value);
                            setShowInvalid(false);
                        }}
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
                        isDisabled={inactive}
                        aria-label='Add measure'
                    >
                        Add measure
                    </Button>
                </Stack>
                {suggestions.length > 0 && (
                    <Stack spacing={1} fontWeight='normal'>
                        <Text fontSize='sm' color='gray.500'>
                            From USDA:
                        </Text>
                        {/* Chips on one row, notes on their own lines, so a note never
                            reads as describing the chip beside it. */}
                        <Wrap>
                            {suggestions.map(
                                (suggestion, index) =>
                                    suggestion.draft && (
                                        <Button
                                            key={index}
                                            size='xs'
                                            variant='outline'
                                            isDisabled={inactive}
                                            onClick={() => addRow(suggestion.draft!)}
                                            aria-label={`Add USDA measure ${suggestion.label}`}
                                        >
                                            {describeWithWeight({
                                                key: '',
                                                draft: suggestion.draft,
                                            })}{' '}
                                            +
                                        </Button>
                                    )
                            )}
                        </Wrap>
                        {suggestions.map(
                            (suggestion, index) =>
                                !suggestion.draft && (
                                    <Text key={index} fontSize='xs' color='gray.500'>
                                        {suggestion.label.toLowerCase()} — {suggestion.reason}
                                    </Text>
                                )
                        )}
                    </Stack>
                )}
            </Stack>
        );
    }
);
