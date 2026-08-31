import { useDebounce } from 'use-debounce';
import { useLazyQuery, useMutation } from '@apollo/client';
import { NumberInputStepper, Stack, Text } from '@chakra-ui/react';
import { FormControl, FormLabel, NumberDecrementStepper } from '@chakra-ui/react';
import { HStack, Radio, RadioGroup, SimpleGrid, Skeleton } from '@chakra-ui/react';
import { NumberIncrementStepper, NumberInput, NumberInputField } from '@chakra-ui/react';
import { Alert, AlertDescription, AlertIcon, AlertTitle, Box, Button } from '@chakra-ui/react';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from 'react';

import { DEBOUNCE_TIME } from '@recipe/constants';
import { MacroNutrients } from '@recipe/utils/nutrition';
import { UsdaSearchQuery } from '@recipe/graphql/generated';
import { FloatingLabelInput } from '@recipe/common/components';
import { USDA_SEARCH } from '@recipe/graphql/queries/nutritionalInfo';
import { USDA_FOOD_ITEM } from '@recipe/graphql/queries/nutritionalInfo';
import { CREATE_NUTRITIONAL_INFO } from '@recipe/graphql/mutations/nutritionalInfo';
import { UPDATE_NUTRITIONAL_INFO } from '@recipe/graphql/mutations/nutritionalInfo';
import { DELETE_NUTRITIONAL_INFO } from '@recipe/graphql/mutations/nutritionalInfo';
import { GetNutritionalInfosByIngredientIdsQuery } from '@recipe/graphql/generated';

import { UsdaDensitySuggestion } from './UsdaDensitySuggestion';
import { UsdaPortion, UsdaPortionPicker } from './UsdaPortionPicker';

export type ExistingNutritionalInfo = NonNullable<
    GetNutritionalInfosByIngredientIdsQuery['nutritionalInfosByIngredientIds']
>[number];

export interface DensitySuggestion {
    density: number;
    /** e.g. "1 cup" */
    portionDescription: string;
    /** e.g. 216 */
    gramWeight: number;
    ambiguous: boolean;
}

export interface UsdaLinkSectionProps {
    ingredientId?: string;
    ingredientName?: string;
    isCountable?: boolean;
    /** The form's current density, so an already-matching suggestion can be suppressed. */
    currentDensity?: number;
    disabled?: boolean;
    /** Called when a chosen portion implies a density for the ingredient. The parent
     *  form applies it to its own density field, so it saves with the ingredient
     *  record in both the create and the edit flow. This component never writes
     *  density itself -- it has no mutation for it. */
    onDensitySuggested?: (suggestion: DensitySuggestion) => void;
    /** Nutritional info for this ingredient, prefetched by the page alongside the ingredient list. */
    existingNutritionalInfo?: ExistingNutritionalInfo | null;
    /** Called after a link is created or cleared, so the prefetched list can be refreshed. */
    onNutritionalInfoChange?: () => void;
}

/** Imperative handle so a parent that creates a brand new ingredient can commit
 *  nutritional data staged before the ingredient existed, once it has a real id. */
export interface UsdaLinkSectionHandle {
    commitPendingLink: (ingredientId: string) => Promise<void>;
}

const ZERO_MACROS: MacroNutrients = { calories: 0, protein: 0, carbs: 0, fat: 0 };

type UsdaSearchResultItem = NonNullable<NonNullable<UsdaSearchQuery['usdaSearch']>[number]>;

function round1(n: number | null | undefined): string {
    if (n == null) return '—';
    return n.toFixed(1).replace(/\.0$/, '');
}

/** The per-unit NumberInputs render at 2dp, so derived values are rounded to match. */
function round2(n: number): number {
    return Math.round(n * 100) / 100;
}

/** A suggestion within this fraction of the form's current density adds nothing. */
const DENSITY_TOLERANCE = 0.1;

export const UsdaLinkSection = forwardRef<UsdaLinkSectionHandle, UsdaLinkSectionProps>(
    function UsdaLinkSection(props, ref) {
        const {
            ingredientId,
            ingredientName,
            isCountable,
            currentDensity,
            disabled,
            onDensitySuggested,
            existingNutritionalInfo,
            onNutritionalInfoChange,
        } = props;

        const [searchInput, setSearchInput] = useState('');
        const [debouncedSearch] = useDebounce(searchInput, DEBOUNCE_TIME);

        const [selectedFdcId, setSelectedFdcId] = useState<number | null>(null);
        const [pendingNutrition, setPendingNutrition] = useState<{
            fdcId: number;
            perGram: MacroNutrients;
        } | null>(null);
        const [perUnitNutrition, setPerUnitNutrition] = useState<MacroNutrients>(ZERO_MACROS);
        const [existingNutritionalInfoId, setExistingNutritionalInfoId] = useState<string | null>(
            null
        );
        const [linked, setLinked] = useState(false);
        const [mutationError, setMutationError] = useState<string | null>(null);
        const [searchResults, setSearchResults] = useState<UsdaSearchResultItem[]>([]);
        // Portions come from the single-item endpoint only; search results carry none.
        const [portions, setPortions] = useState<UsdaPortion[]>([]);
        const [selectedPortion, setSelectedPortion] = useState<string | null>(null);
        /** True while the per-unit fields hold portion-derived values the reader has
         *  not touched. Editing any field clears it but keeps the value. */
        const [perUnitDerived, setPerUnitDerived] = useState(false);

        // Reset all local UI state whenever the ingredient being edited changes, so a
        // selection/search made for one ingredient doesn't leak into the next one, then
        // hydrate from the prefetched nutritional info (if any) for the new ingredient.
        // Also re-runs if that info arrives after the ingredient switch (e.g. first load).
        useEffect(() => {
            setSearchInput(ingredientName ?? '');
            setSelectedFdcId(null);
            setMutationError(null);
            setSearchResults([]);
            setPortions([]);
            setSelectedPortion(null);
            setPerUnitDerived(false);

            if (existingNutritionalInfo) {
                setExistingNutritionalInfoId(existingNutritionalInfo._id);
                setLinked(true);
                if (existingNutritionalInfo.perGram) {
                    setPendingNutrition({
                        fdcId: existingNutritionalInfo.usdaFdcId ?? 0,
                        perGram: {
                            calories: existingNutritionalInfo.perGram.calories,
                            protein: existingNutritionalInfo.perGram.protein,
                            carbs: existingNutritionalInfo.perGram.carbs,
                            fat: existingNutritionalInfo.perGram.fat,
                        },
                    });
                } else {
                    setPendingNutrition(null);
                }
                setPerUnitNutrition(
                    existingNutritionalInfo.perUnit
                        ? {
                              calories: existingNutritionalInfo.perUnit.calories,
                              protein: existingNutritionalInfo.perUnit.protein,
                              carbs: existingNutritionalInfo.perUnit.carbs,
                              fat: existingNutritionalInfo.perUnit.fat,
                          }
                        : ZERO_MACROS
                );
            } else {
                setExistingNutritionalInfoId(null);
                setLinked(false);
                setPendingNutrition(null);
                setPerUnitNutrition(ZERO_MACROS);
            }
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [ingredientId, existingNutritionalInfo?._id]);

        const [runSearch, { loading: searchLoading }] = useLazyQuery(USDA_SEARCH, {
            onCompleted: (data) => {
                setSearchResults((data.usdaSearch ?? []).filter((r) => r != null));
            },
        });

        const [fetchFoodItem, { loading: detailLoading }] = useLazyQuery(USDA_FOOD_ITEM, {
            onCompleted: (data) => {
                setPortions(data.usdaFoodItem?.portions ?? []);
            },
            onError: () => {
                // Portion data is an enhancement: perGram is already linkable without it.
                setPortions([]);
            },
        });

        const [createNutritionalInfo] = useMutation(CREATE_NUTRITIONAL_INFO, {
            onCompleted: (data) => {
                const id = data.nutritionalInfoCreateOne?.record?._id;
                if (id) setExistingNutritionalInfoId(id);
                setLinked(true);
                setMutationError(null);
                onNutritionalInfoChange?.();
            },
            onError: (err) => {
                setLinked(false);
                setMutationError(err.message);
            },
        });

        const [updateNutritionalInfo] = useMutation(UPDATE_NUTRITIONAL_INFO, {
            onCompleted: () => {
                setLinked(true);
                setMutationError(null);
            },
            onError: (err) => {
                setLinked(false);
                setMutationError(err.message);
            },
        });

        const [deleteNutritionalInfo] = useMutation(DELETE_NUTRITIONAL_INFO, {
            onCompleted: () => {
                setExistingNutritionalInfoId(null);
                setPendingNutrition(null);
                setPerUnitNutrition(ZERO_MACROS);
                setPortions([]);
                setSelectedPortion(null);
                setPerUnitDerived(false);
                setSelectedFdcId(null);
                setLinked(false);
                setSearchInput('');
                setMutationError(null);
                onNutritionalInfoChange?.();
            },
            onError: (err) => {
                setMutationError(err.message);
            },
        });

        const handleSearch = () => {
            if (debouncedSearch.trim()) {
                runSearch({ variables: { query: debouncedSearch.trim(), pageSize: 20 } });
            }
        };

        const handleSelectResult = (fdcId: number) => {
            setSelectedFdcId(fdcId);
            setPortions([]);
            setSelectedPortion(null);
            setPerUnitDerived(false);
            const item = searchResults.find((r) => r.fdcId === fdcId);
            if (!item) return;
            // perGram still comes from the cached search result, so the macro display
            // does not wait on the second request.
            setPendingNutrition({
                fdcId,
                perGram: {
                    calories: (item.caloriesPer100g ?? 0) / 100,
                    protein: (item.proteinPer100g ?? 0) / 100,
                    carbs: (item.carbsPer100g ?? 0) / 100,
                    fat: (item.fatPer100g ?? 0) / 100,
                },
            });
            fetchFoodItem({ variables: { fdcId } });
        };

        const itemPortions = useMemo(
            () =>
                portions
                    .filter((portion) => portion.kind === 'ITEM')
                    // Ambiguous candidates stay in the list but sort last.
                    .sort((a, b) => Number(a.ambiguous) - Number(b.ambiguous)),
            [portions]
        );

        // Prefer a portion with no qualifier: "cup, chopped" is a packing density.
        const densitySource = useMemo(() => {
            const withDensity = portions.filter((portion) => portion.impliedDensity != null);
            return withDensity.find((portion) => !portion.ambiguous) ?? withDensity[0] ?? null;
        }, [portions]);

        const suggestedDensity = densitySource?.impliedDensity ?? null;
        const densityAlreadySet =
            suggestedDensity != null &&
            currentDensity != null &&
            currentDensity > 0 &&
            Math.abs(currentDensity - suggestedDensity) / suggestedDensity <= DENSITY_TOLERANCE;

        const handleSelectPortion = (portion: UsdaPortion) => {
            setSelectedPortion(portion.description);
            if (!pendingNutrition) return;
            const grams = portion.gramWeight;
            setPerUnitNutrition({
                calories: round2(pendingNutrition.perGram.calories * grams),
                protein: round2(pendingNutrition.perGram.protein * grams),
                carbs: round2(pendingNutrition.perGram.carbs * grams),
                fat: round2(pendingNutrition.perGram.fat * grams),
            });
            setPerUnitDerived(true);
        };

        const handleApplyDensity = () => {
            if (densitySource == null || densitySource.impliedDensity == null) return;
            onDensitySuggested?.({
                density: densitySource.impliedDensity,
                portionDescription: densitySource.description,
                gramWeight: densitySource.gramWeight,
                ambiguous: densitySource.ambiguous,
            });
        };

        const buildRecord = useCallback(
            (
                targetIngredientId: string,
                nutrition: { fdcId: number; perGram: MacroNutrients }
            ): {
                ingredient: string;
                usdaFdcId?: number;
                perGram: MacroNutrients;
                perUnit?: MacroNutrients;
            } => {
                const record: {
                    ingredient: string;
                    usdaFdcId?: number;
                    perGram: MacroNutrients;
                    perUnit?: MacroNutrients;
                } = {
                    ingredient: targetIngredientId,
                    usdaFdcId: nutrition.fdcId || undefined,
                    perGram: nutrition.perGram,
                };

                const hasPerUnit =
                    isCountable &&
                    (perUnitNutrition.calories > 0 ||
                        perUnitNutrition.protein > 0 ||
                        perUnitNutrition.carbs > 0 ||
                        perUnitNutrition.fat > 0);

                if (hasPerUnit) {
                    record.perUnit = perUnitNutrition;
                }

                return record;
            },
            [isCountable, perUnitNutrition]
        );

        const handleLink = () => {
            if (!pendingNutrition) return;

            setMutationError(null);

            if (!ingredientId) {
                // No ingredient to link against yet (still being created). Stage the
                // selection locally -- the parent commits it once the ingredient is saved.
                setLinked(true);
                return;
            }

            const record = buildRecord(ingredientId, pendingNutrition);

            if (existingNutritionalInfoId) {
                updateNutritionalInfo({
                    variables: { _id: existingNutritionalInfoId, record },
                });
            } else {
                createNutritionalInfo({ variables: { record } });
            }
            // Note: setLinked(true) is called inside the onCompleted callbacks,
            // not here, so the linked state only changes on confirmed success.
        };

        const commitPendingLink = useCallback(
            async (newIngredientId: string) => {
                if (!pendingNutrition) return;
                const record = buildRecord(newIngredientId, pendingNutrition);
                await createNutritionalInfo({ variables: { record } });
            },
            [pendingNutrition, buildRecord, createNutritionalInfo]
        );

        useImperativeHandle(ref, () => ({ commitPendingLink }), [commitPendingLink]);

        const handleClear = () => {
            setMutationError(null);
            if (existingNutritionalInfoId) {
                deleteNutritionalInfo({ variables: { _id: existingNutritionalInfoId } });
            } else {
                setPendingNutrition(null);
                setPerUnitNutrition(ZERO_MACROS);
                setPortions([]);
                setSelectedPortion(null);
                setPerUnitDerived(false);
                setSelectedFdcId(null);
                setLinked(false);
                setSearchInput('');
            }
        };

        const setPerUnitField =
            (field: keyof MacroNutrients) => (_: string, valueAsNumber: number) => {
                // A manual edit keeps the value but drops the "derived" marker.
                setPerUnitDerived(false);
                setPerUnitNutrition((p) => ({
                    ...p,
                    [field]: Number.isNaN(valueAsNumber) ? 0 : valueAsNumber,
                }));
            };

        return (
            <Stack spacing={3}>
                {mutationError && (
                    <Alert status='error' borderRadius='md'>
                        <AlertIcon />
                        <Box>
                            <AlertTitle>Error saving nutritional data</AlertTitle>
                            <AlertDescription>{mutationError}</AlertDescription>
                        </Box>
                    </Alert>
                )}

                {linked && pendingNutrition ? (
                    <Stack spacing={2}>
                        <Text fontSize='sm' fontWeight={500}>
                            Linked: FDC ID {pendingNutrition.fdcId || '(manual)'}
                        </Text>
                        <Text fontSize='sm' color='gray.500'>
                            Per 100g: {round1(pendingNutrition.perGram.calories * 100)} kcal ·{' '}
                            {round1(pendingNutrition.perGram.protein * 100)}g protein ·{' '}
                            {round1(pendingNutrition.perGram.carbs * 100)}g carbs ·{' '}
                            {round1(pendingNutrition.perGram.fat * 100)}g fat
                        </Text>
                        {isCountable && (
                            <Text fontSize='sm' color='gray.500'>
                                Per unit: {round1(perUnitNutrition.calories)} kcal ·{' '}
                                {round1(perUnitNutrition.protein)}g protein ·{' '}
                                {round1(perUnitNutrition.carbs)}g carbs ·{' '}
                                {round1(perUnitNutrition.fat)}g fat
                            </Text>
                        )}
                        <Button
                            size='xs'
                            variant='ghost'
                            colorScheme='red'
                            alignSelf='flex-start'
                            onClick={handleClear}
                            isDisabled={disabled}
                            aria-label='Clear nutritional data link'
                        >
                            Clear
                        </Button>
                    </Stack>
                ) : (
                    <Stack spacing={4}>
                        <HStack spacing={2} align='flex-end'>
                            <FloatingLabelInput
                                id='usda-search-input'
                                label='Search nutritional data'
                                value={searchInput}
                                isInvalid={false}
                                onChange={(e) => setSearchInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key !== 'Enter') return;
                                    // Stop this from also submitting/saving the ingredient form:
                                    // preventDefault blocks the native implicit form submission,
                                    // and stopPropagation stops the global Enter-to-save listener.
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleSearch();
                                }}
                                isDisabled={disabled}
                                flex={1}
                            />
                            <Button
                                size='md'
                                onClick={handleSearch}
                                isDisabled={disabled || !searchInput.trim()}
                                aria-label='Search USDA database'
                            >
                                Search
                            </Button>
                        </HStack>

                        {searchLoading && (
                            <Stack spacing={2}>
                                <Skeleton height='40px' />
                                <Skeleton height='40px' />
                                <Skeleton height='40px' />
                            </Stack>
                        )}

                        {!searchLoading && searchResults.length > 0 && (
                            <Box
                                maxH='200px'
                                overflowY='auto'
                                overflowX='hidden'
                                w='100%'
                                border='1px solid'
                                borderColor='gray.200'
                                borderRadius='md'
                                p={2}
                            >
                                <RadioGroup
                                    value={selectedFdcId?.toString() ?? ''}
                                    onChange={(val) => handleSelectResult(Number(val))}
                                    aria-label='USDA search results'
                                >
                                    <Stack spacing={1}>
                                        {searchResults.map((item) => (
                                            <Box
                                                key={item.fdcId}
                                                onClick={() => handleSelectResult(item.fdcId)}
                                                cursor='pointer'
                                                borderRadius='sm'
                                                px={2}
                                                py={1}
                                                bg={
                                                    selectedFdcId === item.fdcId
                                                        ? 'gray.100'
                                                        : 'transparent'
                                                }
                                                _hover={{ bg: 'gray.50' }}
                                            >
                                                <HStack spacing={2} align='flex-start' minW={0}>
                                                    <Radio value={item.fdcId.toString()} mt={1} />
                                                    <Stack spacing={0.5} flex={1} minW={0}>
                                                        <Text
                                                            fontSize='sm'
                                                            textTransform='lowercase'
                                                            wordBreak='break-word'
                                                        >
                                                            {item.description}
                                                        </Text>
                                                        {item.brandOwner && (
                                                            <Text
                                                                fontSize='sm'
                                                                color='gray.500'
                                                                textTransform='lowercase'
                                                                wordBreak='break-word'
                                                            >
                                                                {item.brandOwner}
                                                            </Text>
                                                        )}
                                                        <Text
                                                            fontSize='sm'
                                                            color='gray.500'
                                                            textTransform='lowercase'
                                                            wordBreak='break-word'
                                                        >
                                                            {round1(item.caloriesPer100g)} kcal ·{' '}
                                                            {round1(item.proteinPer100g)}g protein ·{' '}
                                                            {round1(item.carbsPer100g)}g carbs ·{' '}
                                                            {round1(item.fatPer100g)}g fat (per
                                                            100g)
                                                        </Text>
                                                    </Stack>
                                                </HStack>
                                            </Box>
                                        ))}
                                    </Stack>
                                </RadioGroup>
                            </Box>
                        )}

                        {isCountable && pendingNutrition && (
                            <UsdaPortionPicker
                                portions={itemPortions}
                                selected={selectedPortion}
                                loading={detailLoading}
                                disabled={disabled}
                                onSelect={handleSelectPortion}
                            />
                        )}

                        {isCountable && pendingNutrition && (
                            <Stack spacing={2}>
                                <Text fontSize='sm' fontWeight={500}>
                                    Per unit nutritional data{' '}
                                    {perUnitDerived ? '(from selected portion)' : '(optional)'}
                                </Text>
                                <SimpleGrid columns={2} spacing={3}>
                                    <FormControl isDisabled={disabled}>
                                        <FormLabel fontSize='sm'>Calories (kcal)</FormLabel>
                                        <NumberInput
                                            size='sm'
                                            value={perUnitNutrition.calories}
                                            min={0}
                                            precision={2}
                                            onChange={setPerUnitField('calories')}
                                            isDisabled={disabled}
                                        >
                                            <NumberInputField
                                                fontSize='sm'
                                                aria-label='Per unit calories'
                                            />
                                            <NumberInputStepper>
                                                <NumberIncrementStepper />
                                                <NumberDecrementStepper />
                                            </NumberInputStepper>
                                        </NumberInput>
                                    </FormControl>
                                    <FormControl isDisabled={disabled}>
                                        <FormLabel fontSize='sm'>Protein (g)</FormLabel>
                                        <NumberInput
                                            size='sm'
                                            value={perUnitNutrition.protein}
                                            min={0}
                                            precision={2}
                                            onChange={setPerUnitField('protein')}
                                            isDisabled={disabled}
                                        >
                                            <NumberInputField
                                                fontSize='sm'
                                                aria-label='Per unit protein'
                                            />
                                            <NumberInputStepper>
                                                <NumberIncrementStepper />
                                                <NumberDecrementStepper />
                                            </NumberInputStepper>
                                        </NumberInput>
                                    </FormControl>
                                    <FormControl isDisabled={disabled}>
                                        <FormLabel fontSize='sm'>Carbs (g)</FormLabel>
                                        <NumberInput
                                            size='sm'
                                            value={perUnitNutrition.carbs}
                                            min={0}
                                            precision={2}
                                            onChange={setPerUnitField('carbs')}
                                            isDisabled={disabled}
                                        >
                                            <NumberInputField
                                                fontSize='sm'
                                                aria-label='Per unit carbs'
                                            />
                                            <NumberInputStepper>
                                                <NumberIncrementStepper />
                                                <NumberDecrementStepper />
                                            </NumberInputStepper>
                                        </NumberInput>
                                    </FormControl>
                                    <FormControl isDisabled={disabled}>
                                        <FormLabel fontSize='sm'>Fat (g)</FormLabel>
                                        <NumberInput
                                            size='sm'
                                            value={perUnitNutrition.fat}
                                            min={0}
                                            precision={2}
                                            onChange={setPerUnitField('fat')}
                                            isDisabled={disabled}
                                        >
                                            <NumberInputField
                                                fontSize='sm'
                                                aria-label='Per unit fat'
                                            />
                                            <NumberInputStepper>
                                                <NumberIncrementStepper />
                                                <NumberDecrementStepper />
                                            </NumberInputStepper>
                                        </NumberInput>
                                    </FormControl>
                                </SimpleGrid>
                            </Stack>
                        )}

                        {pendingNutrition && densitySource && !densityAlreadySet && (
                            <UsdaDensitySuggestion
                                portion={densitySource}
                                density={densitySource.impliedDensity!}
                                currentDensity={
                                    currentDensity && currentDensity > 0
                                        ? currentDensity
                                        : undefined
                                }
                                disabled={disabled}
                                onApply={handleApplyDensity}
                            />
                        )}

                        {pendingNutrition && (
                            <HStack spacing={2}>
                                <Button
                                    size='sm'
                                    onClick={handleLink}
                                    isDisabled={disabled}
                                    aria-label='Link selected nutritional data'
                                >
                                    Link selected item
                                </Button>
                                <Button
                                    size='sm'
                                    variant='ghost'
                                    colorScheme='red'
                                    onClick={handleClear}
                                    isDisabled={disabled}
                                    aria-label='Clear nutritional data selection'
                                >
                                    Clear
                                </Button>
                            </HStack>
                        )}
                    </Stack>
                )}
            </Stack>
        );
    }
);
