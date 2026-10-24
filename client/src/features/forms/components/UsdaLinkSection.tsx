import { useLazyQuery, useMutation } from '@apollo/client';
import { Box, Button, Stack, Text } from '@chakra-ui/react';
import { HStack, Radio, RadioGroup, Skeleton } from '@chakra-ui/react';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from 'react';

import { FloatingLabelInput } from '@recipe/common/components';
import { USDA_SEARCH } from '@recipe/graphql/queries/nutritionalInfo';
import { USDA_FOOD_ITEM } from '@recipe/graphql/queries/nutritionalInfo';
import { EnumNutritionalInfoCreateSource } from '@recipe/graphql/generated';
import { UsdaFoodItemQuery, UsdaSearchQuery } from '@recipe/graphql/generated';
import { CreateOneNutritionalInfoCreateInput } from '@recipe/graphql/generated';
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
    /** Called after a link is saved or removed, so the prefetched list can be refreshed. */
    onNutritionalInfoChange?: () => void;
}

/** Linking and unlinking are staged; the parent saves them with the ingredient, once it has
 *  an id. Throws when the change could not be saved. */
export interface UsdaLinkSectionHandle {
    commitChanges: (ingredientId: string) => Promise<void>;
}

type UsdaSearchResultItem = NonNullable<NonNullable<UsdaSearchQuery['usdaSearch']>[number]>;

function round1(n: number | null | undefined): string {
    if (n == null) return '—';
    return n.toFixed(1).replace(/\.0$/, '');
}

/** "52 kcal · 0.3 g protein · 14 g carbs · 0.2 g fat per 100 g", from per-100 g values. */
function formatPer100g(
    calories: number | null | undefined,
    protein: number | null | undefined,
    carbs: number | null | undefined,
    fat: number | null | undefined
): string {
    return (
        `${round1(calories)} kcal · ${round1(protein)} g protein · ` +
        `${round1(carbs)} g carbs · ${round1(fat)} g fat per 100 g`
    );
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
        const [searchResults, setSearchResults] = useState<UsdaSearchResultItem[]>([]);
        /** True once a search has run for the current input, so an empty result list can
         *  be reported as "no matches" instead of rendering nothing. */
        const [searchAttempted, setSearchAttempted] = useState(false);
        // A failed search is reported as a failure, not as "no matches".
        const [searchError, setSearchError] = useState<string | null>(null);
        // The linked item's USDA name, shown in place of its FDC ID once known.
        const [linkedFoodName, setLinkedFoodName] = useState<string | null>(null);
        // Portions come from the single-item endpoint only; search results carry none.
        const [portions, setPortions] = useState<UsdaPortion[]>([]);

        useEffect(() => {
            onPortionsChange?.(portions);
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [portions]);

        // Reset the search whenever the ingredient being edited changes, so a search made
        // for one ingredient doesn't leak into the next one. Linking and unlinking leave it.
        useEffect(() => {
            setSearchInput(ingredientName ?? '');
            setSelectedFdcId(null);
            setSearchResults([]);
            setSearchAttempted(false);
            setSearchError(null);
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [ingredientId]);

        // Hydrate the link from the prefetched nutritional info (if any) for the ingredient.
        // Also re-runs if that info arrives after the ingredient switch (e.g. first load),
        // or changes after a link or an unlink.
        useEffect(() => {
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

        // Results are handled from the promise each call returns, which resolves with `data`
        // or `error`: the hooks' onCompleted and onError options are deprecated.
        const [runSearchQuery, { loading: searchLoading }] = useLazyQuery(USDA_SEARCH);
        const runSearch = async (options: Parameters<typeof runSearchQuery>[0]) => {
            const { data, error } = await runSearchQuery(options);
            if (error) {
                setSearchResults([]);
                setSearchError(error.message);
                return;
            }
            setSearchResults((data?.usdaSearch ?? []).filter((r) => r != null));
        };

        const [fetchFoodItemQuery, { loading: foodItemLoading }] = useLazyQuery(USDA_FOOD_ITEM);
        const fetchFoodItem = async (options: Parameters<typeof fetchFoodItemQuery>[0]) => {
            const { data, error } = await fetchFoodItemQuery(options);
            if (error) {
                // Portion data is an enhancement: perGram is already linkable without it.
                setPortions([]);
                return;
            }
            setPortions(data?.usdaFoodItem?.portions ?? []);
            if (data?.usdaFoodItem?.description) {
                setLinkedFoodName(data.usdaFoodItem.description);
            }
        };

        // Run only by commitChanges, which reports a failure to the caller.
        const [createNutritionalInfo] = useMutation(CREATE_NUTRITIONAL_INFO);
        const [updateNutritionalInfo] = useMutation(UPDATE_NUTRITIONAL_INFO);
        const [deleteNutritionalInfo] = useMutation(DELETE_NUTRITIONAL_INFO);

        const handleSearch = () => {
            // The live input, not a debounced copy: this only fires on an explicit
            // trigger, so searching a stale value would silently drop recent keystrokes.
            const query = searchInput.trim();
            if (!query) return;
            setSearchAttempted(true);
            setSearchError(null);
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
                nutrition: { fdcId: number; perGram: MacroNutrients },
                name: string | null
            ): CreateOneNutritionalInfoCreateInput => ({
                ingredient: targetIngredientId,
                source: nutrition.fdcId
                    ? EnumNutritionalInfoCreateSource.Usda
                    : EnumNutritionalInfoCreateSource.Manual,
                usdaFdcId: nutrition.fdcId || null,
                openFoodFactsBarcode: null,
                sourceName: nutrition.fdcId ? name : null,
                perGram: nutrition.perGram,
            }),
            []
        );

        // Staged: the link is saved with the ingredient, like every other field.
        const handleLink = () => {
            if (pendingNutrition) setLinked(true);
        };

        const commitChanges = useCallback(
            async (targetIngredientId: string) => {
                // `linked` -- not `pendingNutrition` -- is the user's confirmation: selecting
                // a search result stages macros for display, but only "Link selected item"
                // means they want it saved.
                const wanted = linked && pendingNutrition ? pendingNutrition : null;
                const saved = existingNutritionalInfo?.perGram
                    ? {
                          fdcId: existingNutritionalInfo.usdaFdcId ?? 0,
                          perGram: existingNutritionalInfo.perGram,
                      }
                    : null;
                const unchanged =
                    wanted && saved
                        ? wanted.fdcId === saved.fdcId &&
                          (['calories', 'protein', 'carbs', 'fat'] as const).every(
                              (key) => wanted.perGram[key] === saved.perGram[key]
                          )
                        : !wanted && !existingNutritionalInfoId;
                if (unchanged) return;

                let result;
                if (wanted && existingNutritionalInfoId) {
                    result = await updateNutritionalInfo({
                        variables: {
                            _id: existingNutritionalInfoId,
                            record: buildRecord(targetIngredientId, wanted, linkedFoodName),
                        },
                    });
                } else if (wanted) {
                    result = await createNutritionalInfo({
                        variables: {
                            record: buildRecord(targetIngredientId, wanted, linkedFoodName),
                        },
                    });
                } else {
                    result = await deleteNutritionalInfo({
                        variables: { _id: existingNutritionalInfoId! },
                    });
                }
                if (result.errors?.length) {
                    throw new Error(result.errors[0].message);
                }
                onNutritionalInfoChange?.();
            },
            [
                linked,
                pendingNutrition,
                existingNutritionalInfo,
                existingNutritionalInfoId,
                buildRecord,
                linkedFoodName,
                createNutritionalInfo,
                updateNutritionalInfo,
                deleteNutritionalInfo,
                onNutritionalInfoChange,
            ]
        );

        useImperativeHandle(ref, () => ({ commitChanges }), [commitChanges]);

        /** Drops the selected or linked item. The search and its results stay. */
        function clearSelection() {
            setPendingNutrition(null);
            setLinkedFoodName(null);
            setPortions([]);
            setSelectedFdcId(null);
            setLinked(false);
        }

        // Staged: the saved link is removed only when the ingredient is saved.
        const handleUnlink = clearSelection;

        // Chakra fades a disabled field to 0.4; plain text has to fade itself to match.
        const dimmed = disabled ? 0.4 : undefined;

        return (
            <Stack spacing={4}>
                <Text opacity={dimmed}>Nutritional data</Text>
                {linked && pendingNutrition ? (
                    <Stack spacing={2} fontWeight='normal'>
                        {!linkedFoodName && foodItemLoading ? (
                            <HStack fontSize='sm' spacing={1}>
                                <Text>Linked:</Text>
                                <Skeleton
                                    height='10px'
                                    width='12em'
                                    aria-label='Loading linked item name'
                                />
                            </HStack>
                        ) : (
                            <Text fontSize='sm'>
                                {linkedFoodName
                                    ? `Linked: ${linkedFoodName.toLowerCase()}`
                                    : pendingNutrition.fdcId
                                      ? `Linked: FDC ID ${pendingNutrition.fdcId}`
                                      : 'Entered manually'}
                            </Text>
                        )}
                        <Text fontSize='sm' color='gray.500'>
                            {formatPer100g(
                                pendingNutrition.perGram.calories * 100,
                                pendingNutrition.perGram.protein * 100,
                                pendingNutrition.perGram.carbs * 100,
                                pendingNutrition.perGram.fat * 100
                            )}
                        </Text>
                        <Button
                            size='sm'
                            variant='outline'
                            colorScheme='red'
                            alignSelf='flex-start'
                            onClick={handleUnlink}
                            isDisabled={disabled}
                            aria-label='Unlink nutritional data'
                        >
                            Unlink
                        </Button>
                    </Stack>
                ) : (
                    <Stack spacing={4} fontWeight='normal'>
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

                        {!searchLoading && searchError && (
                            <Text fontSize='sm' color='red.500'>
                                The search failed: {searchError}
                            </Text>
                        )}

                        {!searchLoading &&
                            !searchError &&
                            searchAttempted &&
                            searchResults.length === 0 && (
                                <Text fontSize='sm' color='gray.500'>
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
                                                            {formatPer100g(
                                                                item.caloriesPer100g,
                                                                item.proteinPer100g,
                                                                item.carbsPer100g,
                                                                item.fatPer100g
                                                            )}
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
                                    onClick={clearSelection}
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
