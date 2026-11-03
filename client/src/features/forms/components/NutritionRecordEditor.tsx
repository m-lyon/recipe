import { useState } from 'react';
import { Collapse } from '@mantine/core';
import { Stack, Text } from '@chakra-ui/react';
import { useLazyQuery, useMutation, useQuery } from '@apollo/client';
import { Box, Button, HStack, Link, Radio, RadioGroup, Skeleton } from '@chakra-ui/react';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef } from 'react';

import { usePreferencesStore } from '@recipe/stores';
import { CURRENT_USER } from '@recipe/graphql/queries/user';
import { USDA_FOOD_ITEM } from '@recipe/graphql/queries/nutritionalInfo';
import { CreateOneNutritionalInfoCreateInput } from '@recipe/graphql/generated';
import { OPEN_FOOD_FACTS_PRODUCT } from '@recipe/graphql/queries/nutritionalInfo';
import { CREATE_NUTRITIONAL_INFO } from '@recipe/graphql/mutations/nutritionalInfo';
import { UPDATE_NUTRITIONAL_INFO } from '@recipe/graphql/mutations/nutritionalInfo';
import { DELETE_NUTRITIONAL_INFO } from '@recipe/graphql/mutations/nutritionalInfo';

import { OpenFoodFactsPanel } from './OpenFoodFactsPanel';
import { ManualNutritionPanel } from './ManualNutritionPanel';
import { NutritionSource, SOURCE_ENUM } from './nutritionTypes';
import { ClearSelectionButton, UsdaSearchPanel } from './UsdaSearchPanel';
import { MeasureForDensity, formatPer100, openFoodFactsUrl } from '../utils/nutrition';
import { ExistingNutritionalInfo, NutritionPortion, NutritionSelection } from './nutritionTypes';

const SOURCE_CHOICES: { value: NutritionSource; label: string }[] = [
    { value: 'usda', label: 'Generic foods (USDA)' },
    { value: 'openFoodFacts', label: 'UK products (Open Food Facts)' },
    { value: 'manual', label: 'Enter manually' },
];

const TRANSITION_MS = 300;

// One array, so an effect that depends on the portions does not run on every render.
const NO_PORTIONS: NutritionPortion[] = [];

export interface ShownNutrition {
    source: NutritionSource;
    perGram: MacroNutrients;
    portions: NutritionPortion[];
}

export interface NutritionRecordEditorProps {
    /** Unique within the form, for input ids. */
    slotKey: string;
    ingredientId?: string;
    ingredientName?: string;
    disabled?: boolean;
    prepMethod: { _id: string; value: string } | null;
    existing?: ExistingNutritionalInfo | null;
    measures: MeasureForDensity[];
    onShownChange: (shown: ShownNutrition | null) => void;
}

/** Changes are staged. Resolves true when the record was written. Throws when the change
 *  could not be saved. */
export interface NutritionRecordEditorHandle {
    commitChanges: (ingredientId: string) => Promise<boolean>;
}

function selectionFromExisting(info: ExistingNutritionalInfo): NutritionSelection {
    return {
        source: info.source,
        usdaFdcId: info.usdaFdcId ?? null,
        openFoodFactsBarcode: info.openFoodFactsBarcode ?? null,
        sourceName: info.sourceName ?? null,
        perGram: {
            calories: info.perGram.calories,
            protein: info.perGram.protein,
            carbs: info.perGram.carbs,
            fat: info.perGram.fat,
        },
        portions: [],
    };
}

function sameValues(a: NutritionSelection, b: NutritionSelection): boolean {
    return (
        a.source === b.source &&
        a.usdaFdcId === b.usdaFdcId &&
        a.openFoodFactsBarcode === b.openFoodFactsBarcode &&
        a.sourceName === b.sourceName &&
        (['calories', 'protein', 'carbs', 'fat'] as const).every(
            (key) => a.perGram[key] === b.perGram[key]
        )
    );
}

export const NutritionRecordEditor = forwardRef<
    NutritionRecordEditorHandle,
    NutritionRecordEditorProps
>(function NutritionRecordEditor(props, ref) {
    const { slotKey, ingredientId, ingredientName, disabled, prepMethod, existing } = props;
    const { measures, onShownChange } = props;

    // Read from the cache only: the navbar has fetched the user, and a request here
    // would add nothing.
    const { data: userData } = useQuery(CURRENT_USER, { fetchPolicy: 'cache-only' });
    const userId = userData?.currentUser?._id ?? '';
    const preferred = usePreferencesStore((state) => state.nutritionSourceByUser[userId]);
    const setPreferred = usePreferencesStore((state) => state.setNutritionSource);
    const [source, setSource] = useState<NutritionSource>(preferred ?? 'usda');

    const saved = useMemo(() => (existing ? selectionFromExisting(existing) : null), [existing]);
    const savedKey = JSON.stringify(saved);
    // The selection in the open search. It replaces the saved values when the form is saved.
    const [selection, setSelection] = useState<NutritionSelection | null>(null);
    // True once the saved values are unlinked: saving the form then removes them.
    const [removed, setRemoved] = useState(false);
    // True while the search is open to replace the saved values.
    const [changing, setChanging] = useState(false);
    const searching = !saved || removed || changing;
    // A picked result replaces the search. Manual values stay in their form while typed.
    const picked = selection && selection.source !== 'manual' ? selection : null;
    // Kept while the selected item collapses after Clear selection.
    const lastPicked = useRef(picked);
    if (picked) lastPicked.current = picked;
    const shownPick = picked ?? lastPicked.current;
    const shown = selection ?? (removed ? null : saved);

    // Re-runs when the record arrives after the ingredient switch (e.g. first load), or
    // changes after a save.
    useEffect(() => {
        setSelection(null);
        setRemoved(false);
        setChanging(false);
    }, [ingredientId, savedKey]);

    useEffect(() => {
        if (!searching) setSelection(null);
    }, [searching]);

    // Portions, and the USDA item's name, come from a second request. A USDA search
    // result carries no portions. An Open Food Facts product is fetched only for a saved
    // record, since a search result already carries its portions.
    const detailsKey =
        shown?.source === 'usda' && shown.usdaFdcId
            ? `usda:${shown.usdaFdcId}`
            : shown?.source === 'openFoodFacts' && shown === saved && shown.openFoodFactsBarcode
              ? `off:${shown.openFoodFactsBarcode}`
              : null;
    const [details, setDetails] = useState<{
        key: string;
        name: string | null;
        portions: NutritionPortion[];
    } | null>(null);
    const [fetchFoodItem, { loading: foodItemLoading }] = useLazyQuery(USDA_FOOD_ITEM);
    const [fetchProduct] = useLazyQuery(OPEN_FOOD_FACTS_PRODUCT);
    useEffect(() => {
        if (!detailsKey || details?.key === detailsKey) return;
        let stale = false;
        const [kind, id] = detailsKey.split(':');
        // Results are handled from the promise each call returns: the hooks' onCompleted
        // and onError options are deprecated. A failure leaves no portions, which are an
        // enhancement: perGram is already linkable without them.
        const request =
            kind === 'usda'
                ? fetchFoodItem({ variables: { fdcId: Number(id) } }).then(({ data }) => ({
                      name: data?.usdaFoodItem?.description ?? null,
                      portions: data?.usdaFoodItem?.portions ?? [],
                  }))
                : fetchProduct({ variables: { barcode: id } }).then(({ data }) => ({
                      name: null,
                      portions: data?.openFoodFactsProduct?.portions ?? [],
                  }));
        request.then((result) => {
            if (!stale) setDetails({ key: detailsKey, ...result });
        });
        return () => {
            stale = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [detailsKey]);
    const currentDetails = details && details.key === detailsKey ? details : null;
    const portions = shown?.portions.length
        ? shown.portions
        : (currentDetails?.portions ?? NO_PORTIONS);

    useEffect(() => {
        onShownChange(shown ? { source: shown.source, perGram: shown.perGram, portions } : null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [shown, portions]);

    const chooseSource = (next: NutritionSource) => {
        setSource(next);
        setSelection(null);
        setPreferred(userId, next);
    };

    // Run only by commitChanges, which reports a failure to the caller.
    const [createNutritionalInfo] = useMutation(CREATE_NUTRITIONAL_INFO);
    const [updateNutritionalInfo] = useMutation(UPDATE_NUTRITIONAL_INFO);
    const [deleteNutritionalInfo] = useMutation(DELETE_NUTRITIONAL_INFO);

    const commitChanges = useCallback(
        async (targetIngredientId: string) => {
            const unchanged = shown && saved ? sameValues(shown, saved) : !shown && !saved;
            if (unchanged) return false;

            const record = (wanted: NutritionSelection): CreateOneNutritionalInfoCreateInput => ({
                ingredient: targetIngredientId,
                ...(prepMethod ? { prepMethod: prepMethod._id } : {}),
                source: SOURCE_ENUM[wanted.source],
                // A change of source clears the other source's id.
                usdaFdcId: wanted.usdaFdcId,
                openFoodFactsBarcode: wanted.openFoodFactsBarcode,
                sourceName: wanted.sourceName,
                perGram: wanted.perGram,
            });
            let result;
            if (shown && existing) {
                result = await updateNutritionalInfo({
                    variables: { _id: existing._id, record: record(shown) },
                });
            } else if (shown) {
                result = await createNutritionalInfo({ variables: { record: record(shown) } });
            } else {
                result = await deleteNutritionalInfo({ variables: { _id: existing!._id } });
            }
            if (result.errors?.length) {
                throw new Error(result.errors[0].message);
            }
            return true;
        },
        [
            existing,
            saved,
            shown,
            prepMethod,
            createNutritionalInfo,
            updateNutritionalInfo,
            deleteNutritionalInfo,
        ]
    );
    useImperativeHandle(ref, () => ({ commitChanges }), [commitChanges]);

    const targetName = [ingredientName || 'This ingredient', prepMethod?.value]
        .filter(Boolean)
        .join(', ');
    const forPrep = prepMethod ? ` for ${prepMethod.value}` : '';
    const panelProps = {
        idPrefix: slotKey,
        ingredientId,
        ingredientName,
        disabled,
        selection,
        onSelect: setSelection,
    };

    return (
        <Stack spacing={4} role='group' aria-label={`Values for ${targetName}`}>
            {saved && !removed && (
                <Stack spacing={2} fontWeight='normal'>
                    <LinkedText
                        linked={saved}
                        usdaName={selection ? null : (currentDetails?.name ?? null)}
                        loading={!selection && foodItemLoading}
                    />
                    <Text fontSize='sm' color='gray.500'>
                        {formatPer100({
                            calories: saved.perGram.calories * 100,
                            protein: saved.perGram.protein * 100,
                            carbs: saved.perGram.carbs * 100,
                            fat: saved.perGram.fat * 100,
                        })}
                    </Text>
                    {changing ? (
                        <Button
                            size='sm'
                            variant='outline'
                            alignSelf='flex-start'
                            onClick={() => setChanging(false)}
                            isDisabled={disabled}
                            aria-label={`Keep nutritional data${forPrep}`}
                        >
                            Cancel
                        </Button>
                    ) : (
                        <HStack spacing={2}>
                            <Button
                                size='sm'
                                variant='outline'
                                onClick={() => setChanging(true)}
                                isDisabled={disabled}
                                aria-label={`Change nutritional data${forPrep}`}
                            >
                                Change
                            </Button>
                            <Button
                                size='sm'
                                variant='outline'
                                colorScheme='red'
                                onClick={() => setRemoved(true)}
                                isDisabled={disabled}
                                aria-label={`Unlink nutritional data${forPrep}`}
                            >
                                Unlink
                            </Button>
                        </HStack>
                    )}
                    {selection && (
                        <Text fontSize='sm' color='gray.500'>
                            The selected values replace these when you save.
                        </Text>
                    )}
                </Stack>
            )}
            {saved && removed && (
                <HStack spacing={2} fontWeight='normal'>
                    <Text fontSize='sm'>The saved values are removed when you save.</Text>
                    <Button
                        size='sm'
                        variant='outline'
                        onClick={() => setRemoved(false)}
                        isDisabled={disabled}
                        aria-label={`Undo unlink${forPrep}`}
                    >
                        Undo
                    </Button>
                </HStack>
            )}
            <Collapse in={picked !== null} transitionDuration={TRANSITION_MS}>
                {shownPick && (
                    <Stack spacing={2} fontWeight='normal'>
                        <LinkedText
                            linked={shownPick}
                            label='Selected'
                            usdaName={currentDetails?.name ?? null}
                            loading={foodItemLoading}
                        />
                        <Text fontSize='sm' color='gray.500'>
                            {formatPer100({
                                calories: shownPick.perGram.calories * 100,
                                protein: shownPick.perGram.protein * 100,
                                carbs: shownPick.perGram.carbs * 100,
                                fat: shownPick.perGram.fat * 100,
                            })}
                        </Text>
                        {shownPick.warnings && shownPick.warnings.length > 0 && (
                            <Text fontSize='sm' color='orange.600'>
                                {shownPick.warnings.join('. ')}. Check the values against the pack
                                label.
                            </Text>
                        )}
                        <ClearSelectionButton
                            disabled={disabled}
                            onClear={() => setSelection(null)}
                        />
                    </Stack>
                )}
            </Collapse>
            {/* Panels stay mounted while collapsed, so clearing a selection finds the search as
                it was. */}
            <Collapse in={searching && picked === null} transitionDuration={TRANSITION_MS}>
                <Stack spacing={1}>
                    <RadioGroup
                        value={source}
                        onChange={(value) => chooseSource(value as NutritionSource)}
                        isDisabled={disabled}
                        aria-label='Nutritional data source'
                        fontWeight='normal'
                    >
                        <Stack spacing={1}>
                            {SOURCE_CHOICES.map((choice) => (
                                <Radio key={choice.value} value={choice.value}>
                                    {choice.label}
                                </Radio>
                            ))}
                        </Stack>
                    </RadioGroup>
                    <PanelCollapse open={source === 'usda'}>
                        <UsdaSearchPanel {...panelProps} active={source === 'usda' && searching} />
                    </PanelCollapse>
                    <PanelCollapse open={source === 'openFoodFacts'}>
                        <OpenFoodFactsPanel
                            {...panelProps}
                            active={source === 'openFoodFacts' && searching}
                        />
                    </PanelCollapse>
                    <PanelCollapse open={source === 'manual'}>
                        <ManualNutritionPanel
                            {...panelProps}
                            active={source === 'manual' && searching}
                            measures={measures}
                            prepMethodId={prepMethod?._id ?? null}
                            targetName={targetName}
                        />
                    </PanelCollapse>
                </Stack>
            </Collapse>
        </Stack>
    );
});

/** The padding keeps the floating label of a panel's first input inside the collapse, which
 *  clips its content while it animates. */
function PanelCollapse(props: { open: boolean; children: React.ReactNode }) {
    return (
        <Collapse in={props.open} transitionDuration={TRANSITION_MS}>
            <Box pt={3}>{props.children}</Box>
        </Collapse>
    );
}

function LinkedText(props: {
    linked: NutritionSelection;
    label?: string;
    usdaName: string | null;
    loading: boolean;
}) {
    const { linked, label = 'Linked', usdaName, loading } = props;
    if (linked.source === 'manual') {
        return (
            <Text fontSize='sm'>
                {['Entered manually', linked.sourceName].filter(Boolean).join(' · ')}
            </Text>
        );
    }
    if (linked.source === 'openFoodFacts') {
        const barcode = linked.openFoodFactsBarcode ?? '';
        // The product page link gives the ODbL attribution.
        return (
            <Text fontSize='sm'>
                {label}: {linked.sourceName ?? barcode} ·{' '}
                <Link href={openFoodFactsUrl(barcode)} isExternal textDecoration='underline'>
                    Open Food Facts {barcode}
                </Link>
            </Text>
        );
    }
    const name = usdaName ?? linked.sourceName;
    if (!name && loading) {
        return (
            <HStack fontSize='sm' spacing={1}>
                <Text>{label}:</Text>
                <Skeleton height='10px' width='12em' aria-label='Loading linked item name' />
            </HStack>
        );
    }
    return (
        <Text fontSize='sm'>
            {label}: {name ? name.toLowerCase() : `FDC ID ${linked.usdaFdcId}`}
        </Text>
    );
}
