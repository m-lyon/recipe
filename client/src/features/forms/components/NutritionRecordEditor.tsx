import { Stack, Text, Wrap } from '@chakra-ui/react';
import { useLazyQuery, useMutation, useQuery } from '@apollo/client';
import { Box, Button, HStack, Link, Radio, RadioGroup, Skeleton } from '@chakra-ui/react';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from 'react';

import { usePreferencesStore } from '@recipe/stores';
import { CURRENT_USER } from '@recipe/graphql/queries/user';
import { USDA_FOOD_ITEM } from '@recipe/graphql/queries/nutritionalInfo';
import { CreateOneNutritionalInfoCreateInput } from '@recipe/graphql/generated';
import { OPEN_FOOD_FACTS_PRODUCT } from '@recipe/graphql/queries/nutritionalInfo';
import { CREATE_NUTRITIONAL_INFO } from '@recipe/graphql/mutations/nutritionalInfo';
import { UPDATE_NUTRITIONAL_INFO } from '@recipe/graphql/mutations/nutritionalInfo';
import { DELETE_NUTRITIONAL_INFO } from '@recipe/graphql/mutations/nutritionalInfo';

import { UsdaSearchPanel } from './UsdaSearchPanel';
import { OpenFoodFactsPanel } from './OpenFoodFactsPanel';
import { ManualNutritionPanel } from './ManualNutritionPanel';
import { NutritionSource, SOURCE_ENUM } from './nutritionTypes';
import { MeasureForDensity, formatPer100, openFoodFactsUrl } from '../utils/nutrition';
import { ExistingNutritionalInfo, NutritionPortion, NutritionSelection } from './nutritionTypes';

const SOURCE_CHOICES: { value: NutritionSource; label: string }[] = [
    { value: 'usda', label: 'Generic foods (USDA)' },
    { value: 'openFoodFacts', label: 'UK products (Open Food Facts)' },
    { value: 'manual', label: 'Enter manually' },
];

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
    /** Present for a record added in this form and not yet saved. */
    onRemove?: () => void;
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
    const { measures, onShownChange, onRemove } = props;

    // Read from the cache only: the navbar has fetched the user, and a request here
    // would add nothing.
    const { data: userData } = useQuery(CURRENT_USER, { fetchPolicy: 'cache-only' });
    const userId = userData?.currentUser?._id ?? '';
    const preferred = usePreferencesStore((state) => state.nutritionSourceByUser[userId]);
    const setPreferred = usePreferencesStore((state) => state.setNutritionSource);
    const [source, setSource] = useState<NutritionSource>(preferred ?? 'usda');

    // The values to save, once the user links them or the saved record is loaded.
    const [linked, setLinked] = useState<NutritionSelection | null>(null);
    // The values selected in the active panel, shown to the measures list before a link.
    const [preview, setPreview] = useState<NutritionSelection | null>(null);
    const shown = linked ?? preview;

    // Hydrate the link from the prefetched record. Re-runs when that record arrives after
    // the ingredient switch (e.g. first load), or changes after a save.
    useEffect(() => {
        setLinked(existing ? selectionFromExisting(existing) : null);
        setPreview(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ingredientId, existing?._id]);

    // Portions, and the USDA item's name, come from a second request. A USDA search
    // result carries no portions. An Open Food Facts product is fetched only for a saved
    // record, since a search result already carries its portions.
    const detailsKey =
        shown?.source === 'usda' && shown.usdaFdcId
            ? `usda:${shown.usdaFdcId}`
            : shown?.source === 'openFoodFacts' &&
                shown === linked &&
                shown.openFoodFactsBarcode &&
                shown.openFoodFactsBarcode === existing?.openFoodFactsBarcode
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
        setPreview(null);
        setPreferred(userId, next);
    };

    // Run only by commitChanges, which reports a failure to the caller.
    const [createNutritionalInfo] = useMutation(CREATE_NUTRITIONAL_INFO);
    const [updateNutritionalInfo] = useMutation(UPDATE_NUTRITIONAL_INFO);
    const [deleteNutritionalInfo] = useMutation(DELETE_NUTRITIONAL_INFO);

    const commitChanges = useCallback(
        async (targetIngredientId: string) => {
            const saved = existing ? selectionFromExisting(existing) : null;
            const unchanged = linked && saved ? sameValues(linked, saved) : !linked && !saved;
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
            if (linked && existing) {
                result = await updateNutritionalInfo({
                    variables: { _id: existing._id, record: record(linked) },
                });
            } else if (linked) {
                result = await createNutritionalInfo({ variables: { record: record(linked) } });
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
            linked,
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
    const title = prepMethod ? `Nutritional data · ${prepMethod.value}` : 'Nutritional data';
    // Chakra fades a disabled field to 0.4; plain text has to fade itself to match.
    const dimmed = disabled ? 0.4 : undefined;
    const panelProps = {
        idPrefix: slotKey,
        ingredientId,
        ingredientName,
        disabled,
        onPreview: setPreview,
        // Staged: the link is saved with the ingredient, like every other field.
        onLink: setLinked,
    };

    return (
        <Stack spacing={4} role='group' aria-label={title}>
            <HStack>
                <Text opacity={dimmed} flex={1}>
                    {title}
                </Text>
                {onRemove && !linked && (
                    <Button
                        size='sm'
                        variant='outline'
                        colorScheme='red'
                        onClick={onRemove}
                        isDisabled={disabled}
                        aria-label={`Remove nutritional data for ${prepMethod?.value}`}
                    >
                        Remove
                    </Button>
                )}
            </HStack>
            {linked && (
                <Stack spacing={2} fontWeight='normal'>
                    <LinkedText
                        linked={linked}
                        usdaName={currentDetails?.name ?? null}
                        loading={foodItemLoading}
                    />
                    <Text fontSize='sm' color='gray.500'>
                        {formatPer100({
                            calories: linked.perGram.calories * 100,
                            protein: linked.perGram.protein * 100,
                            carbs: linked.perGram.carbs * 100,
                            fat: linked.perGram.fat * 100,
                        })}
                    </Text>
                    <Button
                        size='sm'
                        variant='outline'
                        colorScheme='red'
                        alignSelf='flex-start'
                        // Staged: the saved record is removed only when the ingredient is saved.
                        onClick={() => setLinked(null)}
                        isDisabled={disabled}
                        aria-label={
                            prepMethod
                                ? `Unlink nutritional data for ${prepMethod.value}`
                                : 'Unlink nutritional data'
                        }
                    >
                        Unlink
                    </Button>
                </Stack>
            )}
            {/* Panels stay mounted while linked, so an unlink finds the search as it was. */}
            <Stack spacing={4} hidden={Boolean(linked)}>
                <RadioGroup
                    value={source}
                    onChange={(value) => chooseSource(value as NutritionSource)}
                    isDisabled={disabled}
                    aria-label='Nutritional data source'
                    fontWeight='normal'
                >
                    <Wrap spacingX='12px' spacingY={1}>
                        {SOURCE_CHOICES.map((choice) => (
                            <Radio key={choice.value} value={choice.value}>
                                {choice.label}
                            </Radio>
                        ))}
                    </Wrap>
                </RadioGroup>
                <Box hidden={source !== 'usda'}>
                    <UsdaSearchPanel {...panelProps} active={source === 'usda' && !linked} />
                </Box>
                <Box hidden={source !== 'openFoodFacts'}>
                    <OpenFoodFactsPanel
                        {...panelProps}
                        active={source === 'openFoodFacts' && !linked}
                    />
                </Box>
                <Box hidden={source !== 'manual'}>
                    <ManualNutritionPanel
                        {...panelProps}
                        active={source === 'manual' && !linked}
                        measures={measures}
                        prepMethodId={prepMethod?._id ?? null}
                        targetName={targetName}
                    />
                </Box>
            </Stack>
        </Stack>
    );
});

function LinkedText(props: {
    linked: NutritionSelection;
    usdaName: string | null;
    loading: boolean;
}) {
    const { linked, usdaName, loading } = props;
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
                Linked: {linked.sourceName ?? barcode} ·{' '}
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
                <Text>Linked:</Text>
                <Skeleton height='10px' width='12em' aria-label='Loading linked item name' />
            </HStack>
        );
    }
    return (
        <Text fontSize='sm'>
            {name ? `Linked: ${name.toLowerCase()}` : `Linked: FDC ID ${linked.usdaFdcId}`}
        </Text>
    );
}
