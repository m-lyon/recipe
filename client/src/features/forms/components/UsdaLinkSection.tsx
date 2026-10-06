import { Stack, Text } from '@chakra-ui/react';
import { useLazyQuery, useMutation } from '@apollo/client';
import { HStack, Radio, RadioGroup, Skeleton } from '@chakra-ui/react';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from 'react';
import { Alert, AlertDescription, AlertIcon, AlertTitle, Box, Button } from '@chakra-ui/react';

import { MacroNutrients } from '@recipe/utils/nutrition';
import { FloatingLabelInput } from '@recipe/common/components';
import { USDA_SEARCH } from '@recipe/graphql/queries/nutritionalInfo';
import { USDA_FOOD_ITEM } from '@recipe/graphql/queries/nutritionalInfo';
import { UsdaFoodItemQuery, UsdaSearchQuery } from '@recipe/graphql/generated';
import { CREATE_NUTRITIONAL_INFO } from '@recipe/graphql/mutations/nutritionalInfo';
import { UPDATE_NUTRITIONAL_INFO } from '@recipe/graphql/mutations/nutritionalInfo';
import { DELETE_NUTRITIONAL_INFO } from '@recipe/graphql/mutations/nutritionalInfo';
import { GetNutritionalInfosByIngredientIdsQuery } from '@recipe/graphql/generated';

export type ExistingNutritionalInfo = NonNullable<
    GetNutritionalInfosByIngredientIdsQuery['nutritionalInfosByIngredientIds']
>[number];

export type UsdaPortion = NonNullable<UsdaFoodItemQuery['usdaFoodItem']>['portions'][number];

export interface UsdaLinkSectionProps {
    ingredientId?: string;
    ingredientName?: string;
    disabled?: boolean;
    /** Called with the linked or selected USDA item's portions, which the measures list
     *  offers as one-click rows. Empty when there is no item or it has no portions. */
    onPortionsChange?: (portions: UsdaPortion[]) => void;
    /** Called with the per-gram macros shown, so measures can show their calories. */
    onPerGramChange?: (perGram: MacroNutrients | null) => void;
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
            disabled,
            onPortionsChange,
            onPerGramChange,
            existingNutritionalInfo,
            onNutritionalInfoChange,
        } = props;

        const [searchInput, setSearchInput] = useState('');

        const [selectedFdcId, setSelectedFdcId] = useState<number | null>(null);
        const [pendingNutrition, setPendingNutrition] = useState<{
            fdcId: number;
            perGram: MacroNutrients;
        } | null>(null);
        const [existingNutritionalInfoId, setExistingNutritionalInfoId] = useState<string | null>(
            null
        );
        const [linked, setLinked] = useState(false);
        const [mutationError, setMutationError] = useState<string | null>(null);
        const [searchResults, setSearchResults] = useState<UsdaSearchResultItem[]>([]);
        /** True once a search has run for the current input, so an empty result list can
         *  be reported as "no matches" instead of rendering nothing. */
        const [searchAttempted, setSearchAttempted] = useState(false);
        // The linked item's USDA name, shown in place of its FDC ID once known.
        const [linkedFoodName, setLinkedFoodName] = useState<string | null>(null);
        // Portions come from the single-item endpoint only; search results carry none.
        const [portions, setPortions] = useState<UsdaPortion[]>([]);

        useEffect(() => {
            onPortionsChange?.(portions);
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [portions]);

        // Reset all local UI state whenever the ingredient being edited changes, so a
        // selection/search made for one ingredient doesn't leak into the next one, then
        // hydrate from the prefetched nutritional info (if any) for the new ingredient.
        // Also re-runs if that info arrives after the ingredient switch (e.g. first load).
        useEffect(() => {
            setSearchInput(ingredientName ?? '');
            setSelectedFdcId(null);
            setMutationError(null);
            setSearchResults([]);
            setSearchAttempted(false);
            setLinkedFoodName(null);
            setPortions([]);

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
                    // Fetch the USDA item's name for the "Linked:" display -- the
                    // record itself only stores the FDC ID.
                    if (existingNutritionalInfo.usdaFdcId) {
                        fetchFoodItem({ variables: { fdcId: existingNutritionalInfo.usdaFdcId } });
                    }
                } else {
                    setPendingNutrition(null);
                }
            } else {
                setExistingNutritionalInfoId(null);
                setLinked(false);
                setPendingNutrition(null);
            }
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [ingredientId, existingNutritionalInfo?._id]);

        const [runSearch, { loading: searchLoading }] = useLazyQuery(USDA_SEARCH, {
            onCompleted: (data) => {
                setSearchResults((data.usdaSearch ?? []).filter((r) => r != null));
            },
        });

        const [fetchFoodItem] = useLazyQuery(USDA_FOOD_ITEM, {
            onCompleted: (data) => {
                setPortions(data.usdaFoodItem?.portions ?? []);
                if (data.usdaFoodItem?.description) {
                    setLinkedFoodName(data.usdaFoodItem.description);
                }
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
                setLinkedFoodName(null);
                setPortions([]);
                setSelectedFdcId(null);
                setLinked(false);
                setSearchInput('');
                setSearchAttempted(false);
                setMutationError(null);
                onNutritionalInfoChange?.();
            },
            onError: (err) => {
                setMutationError(err.message);
            },
        });

        const handleSearch = () => {
            // The live input, not a debounced copy: this only fires on an explicit
            // trigger, so searching a stale value would silently drop recent keystrokes.
            const query = searchInput.trim();
            if (!query) return;
            setSearchAttempted(true);
            runSearch({ variables: { query, pageSize: 20 } });
        };

        const handleSelectResult = (fdcId: number) => {
            setSelectedFdcId(fdcId);
            setPortions([]);
            const item = searchResults.find((r) => r.fdcId === fdcId);
            if (!item) return;
            // perGram and the name both come from the cached search result, so the
            // macro and "Linked:" displays do not wait on the second request.
            setLinkedFoodName(item.description);
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

        useEffect(() => {
            onPerGramChange?.(pendingNutrition?.perGram ?? null);
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [pendingNutrition]);

        const buildRecord = useCallback(
            (
                targetIngredientId: string,
                nutrition: { fdcId: number; perGram: MacroNutrients }
            ): { ingredient: string; usdaFdcId?: number; perGram: MacroNutrients } => ({
                ingredient: targetIngredientId,
                usdaFdcId: nutrition.fdcId || undefined,
                perGram: nutrition.perGram,
            }),
            []
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
                // `linked` -- not `pendingNutrition` -- is the user's confirmation: selecting
                // a search result stages macros for display, but only "Link selected item"
                // means they want it saved. Without this the create flow would persist a link
                // the user merely previewed, while the edit flow requires the explicit click.
                if (!linked || !pendingNutrition) return;
                const record = buildRecord(newIngredientId, pendingNutrition);
                // `useMutation` with an `onError` option resolves instead of rejecting,
                // so the failure has to be read off the result for the caller's catch.
                const result = await createNutritionalInfo({ variables: { record } });
                if (result.errors?.length) {
                    throw new Error(result.errors[0].message);
                }
                if (!result.data?.nutritionalInfoCreateOne?.record) {
                    throw new Error('The nutritional data link was not saved.');
                }
            },
            [linked, pendingNutrition, buildRecord, createNutritionalInfo]
        );

        useImperativeHandle(ref, () => ({ commitPendingLink }), [commitPendingLink]);

        const handleClear = () => {
            setMutationError(null);
            if (existingNutritionalInfoId) {
                deleteNutritionalInfo({ variables: { _id: existingNutritionalInfoId } });
            } else {
                setPendingNutrition(null);
                setLinkedFoodName(null);
                setPortions([]);
                setSelectedFdcId(null);
                setLinked(false);
                setSearchInput('');
                setSearchAttempted(false);
            }
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
                        <Text fontSize='sm'>
                            Linked:{' '}
                            {(
                                linkedFoodName ??
                                (pendingNutrition.fdcId
                                    ? `FDC ID ${pendingNutrition.fdcId}`
                                    : '(manual)')
                            ).toLowerCase()}
                        </Text>
                        <Text fontSize='sm' color='gray.500'>
                            Per 100g: {round1(pendingNutrition.perGram.calories * 100)} kcal ·{' '}
                            {round1(pendingNutrition.perGram.protein * 100)}g protein ·{' '}
                            {round1(pendingNutrition.perGram.carbs * 100)}g carbs ·{' '}
                            {round1(pendingNutrition.perGram.fat * 100)}g fat
                        </Text>
                        <Button
                            size='sm'
                            variant='outline'
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
                            <Stack spacing={3}>
                                <Skeleton height='10px' width='40%' />
                                <Skeleton height='10px' />
                                <Skeleton height='10px' />
                                <Skeleton height='10px' width='40%' />
                                <Skeleton height='10px' />
                                <Skeleton height='10px' />
                            </Stack>
                        )}

                        {!searchLoading && searchAttempted && searchResults.length === 0 && (
                            <Text fontSize='sm' color='gray.600'>
                                No matches found. Try a different search term.
                            </Text>
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
                                    variant='outline'
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
