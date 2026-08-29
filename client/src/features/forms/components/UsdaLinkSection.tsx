import { useDebounce } from 'use-debounce';
import { useLazyQuery, useMutation } from '@apollo/client';
import { NumberInputStepper, Stack, Text } from '@chakra-ui/react';
import { FormControl, FormLabel, NumberDecrementStepper } from '@chakra-ui/react';
import { HStack, Radio, RadioGroup, SimpleGrid, Skeleton } from '@chakra-ui/react';
import { NumberIncrementStepper, NumberInput, NumberInputField } from '@chakra-ui/react';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from 'react';
import { Alert, AlertDescription, AlertIcon, AlertTitle, Box, Button } from '@chakra-ui/react';

import { DEBOUNCE_TIME } from '@recipe/constants';
import { MacroNutrients } from '@recipe/utils/nutrition';
import { UsdaSearchQuery } from '@recipe/graphql/generated';
import { FloatingLabelInput } from '@recipe/common/components';
import { USDA_SEARCH } from '@recipe/graphql/queries/nutritionalInfo';
import { CREATE_NUTRITIONAL_INFO } from '@recipe/graphql/mutations/nutritionalInfo';
import { UPDATE_NUTRITIONAL_INFO } from '@recipe/graphql/mutations/nutritionalInfo';
import { DELETE_NUTRITIONAL_INFO } from '@recipe/graphql/mutations/nutritionalInfo';
import { GetNutritionalInfosByIngredientIdsQuery } from '@recipe/graphql/generated';

export type ExistingNutritionalInfo = NonNullable<
    GetNutritionalInfosByIngredientIdsQuery['nutritionalInfosByIngredientIds']
>[number];

export interface UsdaLinkSectionProps {
    ingredientId?: string;
    ingredientName?: string;
    isCountable?: boolean;
    disabled?: boolean;
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

export const UsdaLinkSection = forwardRef<UsdaLinkSectionHandle, UsdaLinkSectionProps>(
    function UsdaLinkSection(props, ref) {
        const {
            ingredientId,
            ingredientName,
            isCountable,
            disabled,
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

        // Reset all local UI state whenever the ingredient being edited changes, so a
        // selection/search made for one ingredient doesn't leak into the next one, then
        // hydrate from the prefetched nutritional info (if any) for the new ingredient.
        // Also re-runs if that info arrives after the ingredient switch (e.g. first load).
        useEffect(() => {
            setSearchInput(ingredientName ?? '');
            setSelectedFdcId(null);
            setMutationError(null);
            setSearchResults([]);

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
            const item = searchResults.find((r) => r.fdcId === fdcId);
            if (!item) return;
            setPendingNutrition({
                fdcId,
                perGram: {
                    calories: (item.caloriesPer100g ?? 0) / 100,
                    protein: (item.proteinPer100g ?? 0) / 100,
                    carbs: (item.carbsPer100g ?? 0) / 100,
                    fat: (item.fatPer100g ?? 0) / 100,
                },
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
                setSelectedFdcId(null);
                setLinked(false);
                setSearchInput('');
            }
        };

        const setPerUnitField =
            (field: keyof MacroNutrients) => (_: string, valueAsNumber: number) => {
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
                        <Text color='gray.500'>
                            Per 100g: {round1(pendingNutrition.perGram.calories * 100)} kcal ·{' '}
                            {round1(pendingNutrition.perGram.protein * 100)}g protein ·{' '}
                            {round1(pendingNutrition.perGram.carbs * 100)}g carbs ·{' '}
                            {round1(pendingNutrition.perGram.fat * 100)}g fat
                        </Text>
                        {isCountable && (
                            <Text color='gray.500'>
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
                    <Stack spacing={2}>
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
                            <Box maxH='200px' overflowY='auto' overflowX='hidden' w='100%'>
                                <RadioGroup
                                    value={selectedFdcId?.toString() ?? ''}
                                    onChange={(val) => handleSelectResult(Number(val))}
                                    aria-label='USDA search results'
                                >
                                    <Stack spacing={2}>
                                        {searchResults.map((item) => (
                                            <Box
                                                key={item.fdcId}
                                                onClick={() => handleSelectResult(item.fdcId)}
                                                cursor='pointer'
                                                py={1}
                                            >
                                                <HStack spacing={2} align='flex-start' minW={0}>
                                                    <Radio value={item.fdcId.toString()} mt={1} />
                                                    <Stack spacing={0.5} flex={1} minW={0}>
                                                        <Text
                                                            textTransform='lowercase'
                                                            wordBreak='break-word'
                                                        >
                                                            {item.description}
                                                        </Text>
                                                        {item.brandOwner && (
                                                            <Text
                                                                color='gray.500'
                                                                textTransform='lowercase'
                                                                wordBreak='break-word'
                                                            >
                                                                {item.brandOwner}
                                                            </Text>
                                                        )}
                                                        <Text
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
                            <Stack spacing={2}>
                                <Text fontSize='sm' fontWeight={500}>
                                    Per unit nutritional data (optional)
                                </Text>
                                <SimpleGrid columns={2} spacing={3}>
                                    <FormControl isDisabled={disabled}>
                                        <FormLabel fontSize='sm'>Calories (kcal)</FormLabel>
                                        <NumberInput
                                            value={perUnitNutrition.calories}
                                            min={0}
                                            precision={2}
                                            onChange={setPerUnitField('calories')}
                                            isDisabled={disabled}
                                        >
                                            <NumberInputField aria-label='Per unit calories' />
                                            <NumberInputStepper>
                                                <NumberIncrementStepper />
                                                <NumberDecrementStepper />
                                            </NumberInputStepper>
                                        </NumberInput>
                                    </FormControl>
                                    <FormControl isDisabled={disabled}>
                                        <FormLabel fontSize='sm'>Protein (g)</FormLabel>
                                        <NumberInput
                                            value={perUnitNutrition.protein}
                                            min={0}
                                            precision={2}
                                            onChange={setPerUnitField('protein')}
                                            isDisabled={disabled}
                                        >
                                            <NumberInputField aria-label='Per unit protein' />
                                            <NumberInputStepper>
                                                <NumberIncrementStepper />
                                                <NumberDecrementStepper />
                                            </NumberInputStepper>
                                        </NumberInput>
                                    </FormControl>
                                    <FormControl isDisabled={disabled}>
                                        <FormLabel fontSize='sm'>Carbs (g)</FormLabel>
                                        <NumberInput
                                            value={perUnitNutrition.carbs}
                                            min={0}
                                            precision={2}
                                            onChange={setPerUnitField('carbs')}
                                            isDisabled={disabled}
                                        >
                                            <NumberInputField aria-label='Per unit carbs' />
                                            <NumberInputStepper>
                                                <NumberIncrementStepper />
                                                <NumberDecrementStepper />
                                            </NumberInputStepper>
                                        </NumberInput>
                                    </FormControl>
                                    <FormControl isDisabled={disabled}>
                                        <FormLabel fontSize='sm'>Fat (g)</FormLabel>
                                        <NumberInput
                                            value={perUnitNutrition.fat}
                                            min={0}
                                            precision={2}
                                            onChange={setPerUnitField('fat')}
                                            isDisabled={disabled}
                                        >
                                            <NumberInputField aria-label='Per unit fat' />
                                            <NumberInputStepper>
                                                <NumberIncrementStepper />
                                                <NumberDecrementStepper />
                                            </NumberInputStepper>
                                        </NumberInput>
                                    </FormControl>
                                </SimpleGrid>
                            </Stack>
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
