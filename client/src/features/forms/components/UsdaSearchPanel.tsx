import { useEffect, useState } from 'react';
import { useLazyQuery } from '@apollo/client';
import { Button, HStack, Stack, Text } from '@chakra-ui/react';

import { UsdaSearchQuery } from '@recipe/graphql/generated';
import { FloatingLabelInput } from '@recipe/common/components';
import { USDA_SEARCH } from '@recipe/graphql/queries/nutritionalInfo';

import { SourcePanelProps } from './nutritionTypes';
import { formatPer100, perGramFrom } from '../utils/nutrition';
import { NutritionResultList, NutritionSearchSkeleton } from './NutritionResultList';

type UsdaSearchResultItem = NonNullable<NonNullable<UsdaSearchQuery['usdaSearch']>[number]>;

function per100gOf(item: UsdaSearchResultItem) {
    return {
        calories: item.caloriesPer100g,
        protein: item.proteinPer100g,
        carbs: item.carbsPer100g,
        fat: item.fatPer100g,
    };
}

/** Stops Enter in a search field from also saving the ingredient form: preventDefault
 *  blocks the native implicit submission, stopPropagation the global Enter-to-save
 *  listener. */
export function onEnter(action: () => void) {
    return (e: React.KeyboardEvent) => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        e.stopPropagation();
        action();
    };
}

export function UsdaSearchPanel(props: SourcePanelProps) {
    const { idPrefix, ingredientId, ingredientName, disabled, selection, onSelect } = props;

    const [searchInput, setSearchInput] = useState('');
    const [searchResults, setSearchResults] = useState<UsdaSearchResultItem[]>([]);
    /** True once a search has run for the current input, so an empty result list can
     *  be reported as "no matches" instead of rendering nothing. */
    const [searchAttempted, setSearchAttempted] = useState(false);
    // A failed search is reported as a failure, not as "no matches".
    const [searchError, setSearchError] = useState<string | null>(null);

    // Reset the search whenever the ingredient being edited changes, so a search made
    // for one ingredient doesn't leak into the next one. Linking and unlinking leave it.
    useEffect(() => {
        setSearchInput(ingredientName ?? '');
        setSearchResults([]);
        setSearchAttempted(false);
        setSearchError(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ingredientId]);

    // Results are handled from the promise each call returns, which resolves with `data`
    // or `error`: the hooks' onCompleted and onError options are deprecated.
    const [runSearchQuery, { loading: searchLoading }] = useLazyQuery(USDA_SEARCH);

    const handleSearch = async () => {
        // The live input, not a debounced copy: this only fires on an explicit
        // trigger, so searching a stale value would silently drop recent keystrokes.
        const query = searchInput.trim();
        if (!query) return;
        onSelect(null);
        setSearchAttempted(true);
        setSearchError(null);
        const { data, error } = await runSearchQuery({ variables: { query, pageSize: 20 } });
        if (error) {
            setSearchResults([]);
            setSearchError(error.message);
            return;
        }
        setSearchResults((data?.usdaSearch ?? []).filter((r) => r != null));
    };

    const handleSelectResult = (fdcId: number) => {
        const item = searchResults.find((r) => r.fdcId === fdcId);
        if (!item) return;
        // perGram and the name both come from the search result, so the macro and
        // "Linked:" displays do not wait on the second request. The record editor
        // fetches the portions: search results carry none.
        onSelect({
            source: 'usda',
            usdaFdcId: fdcId,
            openFoodFactsBarcode: null,
            sourceName: item.description,
            perGram: perGramFrom(per100gOf(item)),
            portions: [],
        });
    };

    return (
        <Stack spacing={4} fontWeight='normal'>
            <HStack spacing={2} align='flex-end'>
                <FloatingLabelInput
                    id={`${idPrefix}-usda-search-input`}
                    label='Search nutritional data'
                    value={searchInput}
                    isInvalid={false}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={onEnter(handleSearch)}
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

            {searchLoading && <NutritionSearchSkeleton />}

            {!searchLoading && searchError && (
                <Text fontSize='sm' color='red.500'>
                    The search failed: {searchError}
                </Text>
            )}

            {!searchLoading && !searchError && searchAttempted && searchResults.length === 0 && (
                <Text fontSize='sm' color='gray.500'>
                    No matches found. Try a different search term.
                </Text>
            )}

            {!searchLoading && searchResults.length > 0 && (
                <NutritionResultList
                    label='USDA search results'
                    lowercase
                    results={searchResults.map((item) => ({
                        key: item.fdcId.toString(),
                        title: item.description,
                        details: [item.brandOwner],
                        per100g: formatPer100(per100gOf(item)),
                    }))}
                    selectedKey={selection?.usdaFdcId?.toString() ?? null}
                    onSelect={(key) => handleSelectResult(Number(key))}
                />
            )}
        </Stack>
    );
}

export function ClearSelectionButton(props: {
    disabled?: boolean;
    onClear: () => void;
    label?: string;
}) {
    return (
        <Button
            size='sm'
            variant='outline'
            alignSelf='flex-start'
            onClick={props.onClear}
            isDisabled={props.disabled}
            aria-label='Clear nutritional data selection'
        >
            {props.label ?? 'Clear selection'}
        </Button>
    );
}
