import { useEffect, useState } from 'react';
import { useLazyQuery } from '@apollo/client';
import { Button, Checkbox, HStack, Stack, Text } from '@chakra-ui/react';

import { FloatingLabelInput } from '@recipe/common/components';
import { OpenFoodFactsProductFieldsFragment } from '@recipe/graphql/generated';
import { OPEN_FOOD_FACTS_SEARCH } from '@recipe/graphql/queries/nutritionalInfo';
import { OPEN_FOOD_FACTS_PRODUCT } from '@recipe/graphql/queries/nutritionalInfo';

import { ClearSelectionButton, onEnter } from './UsdaSearchPanel';
import { formatPer100, hasValidCheckDigit } from '../utils/nutrition';
import { NutritionSelection, SourcePanelProps } from './nutritionTypes';
import { openFoodFactsProductName, perGramFrom } from '../utils/nutrition';
import { NutritionResultList, NutritionSearchSkeleton } from './NutritionResultList';

type Product = OpenFoodFactsProductFieldsFragment;

function per100gOf(product: Product) {
    return {
        calories: product.caloriesPer100g,
        protein: product.proteinPer100g,
        carbs: product.carbsPer100g,
        fat: product.fatPer100g,
    };
}

export function selectionFromProduct(product: Product): NutritionSelection {
    return {
        source: 'openFoodFacts',
        usdaFdcId: null,
        openFoodFactsBarcode: product.barcode,
        sourceName: openFoodFactsProductName(product),
        perGram: perGramFrom(per100gOf(product)),
        portions: product.portions,
    };
}

/**
 * Searches Open Food Facts for packaged products, by name or by barcode. All users share
 * the server's Open Food Facts limit, so a search runs only on Enter or a button press.
 */
export function OpenFoodFactsPanel(props: SourcePanelProps) {
    const { idPrefix, ingredientId, ingredientName, disabled, active, onSelect } = props;

    const [searchInput, setSearchInput] = useState('');
    const [barcodeInput, setBarcodeInput] = useState('');
    const [ukOnly, setUkOnly] = useState(true);
    const [results, setResults] = useState<Product[]>([]);
    const [selected, setSelected] = useState<Product | null>(null);
    // Says what the last search or lookup was, so an empty list can say why.
    const [attempted, setAttempted] = useState<'search' | 'barcode' | null>(null);
    const [error, setError] = useState<string | null>(null);

    const select = (product: Product | null) => {
        setSelected(product);
        onSelect(product ? selectionFromProduct(product) : null);
    };

    useEffect(() => {
        setSearchInput(ingredientName ?? '');
        setBarcodeInput('');
        setResults([]);
        setSelected(null);
        setAttempted(null);
        setError(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ingredientId]);

    useEffect(() => {
        if (!active) setSelected(null);
    }, [active]);

    const [runSearch, { loading: searchLoading }] = useLazyQuery(OPEN_FOOD_FACTS_SEARCH);
    const [runLookup, { loading: lookupLoading }] = useLazyQuery(OPEN_FOOD_FACTS_PRODUCT);
    const loading = searchLoading || lookupLoading;

    const handleSearch = async () => {
        const query = searchInput.trim();
        if (!query) return;
        select(null);
        setAttempted('search');
        setError(null);
        const { data, error } = await runSearch({ variables: { query, pageSize: 20, ukOnly } });
        if (error) {
            setResults([]);
            setError(`The search failed: ${error.message}`);
            return;
        }
        setResults(data?.openFoodFactsSearch ?? []);
    };

    const handleLookup = async () => {
        const barcode = barcodeInput.trim();
        if (!barcode) return;
        select(null);
        setAttempted('barcode');
        // Checked here, so a mistyped digit costs no request.
        if (!hasValidCheckDigit(barcode)) {
            setResults([]);
            setError(
                `${barcode} is not a valid barcode. A barcode has 8 to 14 digits, and the ` +
                    'last digit must match the others. Check for a mistyped digit.'
            );
            return;
        }
        setError(null);
        const { data, error } = await runLookup({ variables: { barcode } });
        const product = data?.openFoodFactsProduct;
        if (error || !product) {
            setResults([]);
            setError(error?.message ?? `No Open Food Facts product with barcode ${barcode}`);
            return;
        }
        setResults([product]);
        select(product);
    };

    return (
        <Stack spacing={4} fontWeight='normal'>
            <HStack spacing={2} align='flex-end'>
                <FloatingLabelInput
                    id={`${idPrefix}-off-search-input`}
                    label='Search products'
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
                    aria-label='Search Open Food Facts'
                >
                    Search
                </Button>
            </HStack>
            <HStack spacing={2} align='flex-end'>
                <FloatingLabelInput
                    id={`${idPrefix}-off-barcode-input`}
                    label='Barcode'
                    inputMode='numeric'
                    value={barcodeInput}
                    isInvalid={attempted === 'barcode' && error !== null && !loading}
                    // Digits only: a pasted barcode often carries spaces.
                    onChange={(e) => setBarcodeInput(e.target.value.replace(/\D/g, ''))}
                    onKeyDown={onEnter(handleLookup)}
                    isDisabled={disabled}
                    flex={1}
                />
                <Button
                    size='md'
                    onClick={handleLookup}
                    isDisabled={disabled || !barcodeInput}
                    aria-label='Look up barcode'
                >
                    Look up
                </Button>
            </HStack>
            <Checkbox
                alignSelf='flex-start'
                // The panel's text is normal weight; checkboxes in the form are bold.
                fontWeight='bold'
                isChecked={!ukOnly}
                isDisabled={disabled}
                onChange={(e) => setUkOnly(!e.target.checked)}
            >
                Search all countries
            </Checkbox>

            {loading && <NutritionSearchSkeleton />}

            {!loading && error && (
                <Text fontSize='sm' color='red.500'>
                    {error}
                </Text>
            )}

            {!loading && !error && attempted === 'search' && results.length === 0 && (
                <Text fontSize='sm' color='gray.500'>
                    No matches found. Try a different search term
                    {ukOnly ? ', or search all countries' : ''}.
                </Text>
            )}

            {!loading && results.length > 0 && (
                <NutritionResultList
                    label='Open Food Facts results'
                    results={results.map((product) => ({
                        key: product.barcode,
                        title: product.name ?? product.barcode,
                        details: [[product.brands, product.quantity].filter(Boolean).join(' · ')],
                        per100g: formatPer100(per100gOf(product)),
                        warnings: product.warnings,
                    }))}
                    selectedKey={selected?.barcode ?? null}
                    onSelect={(barcode) =>
                        select(results.find((product) => product.barcode === barcode) ?? null)
                    }
                />
            )}

            {selected && selected.warnings.length > 0 && (
                <Text fontSize='sm' color='orange.600'>
                    {selected.warnings.join('. ')}. Check the values against the pack label.
                </Text>
            )}

            {selected && <ClearSelectionButton disabled={disabled} onClear={() => select(null)} />}
        </Stack>
    );
}
