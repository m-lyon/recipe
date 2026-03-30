import { useState } from 'react';
import { useLazyQuery, useMutation, useQuery } from '@apollo/client';
import { useDebouncedValue } from '@mantine/hooks';
import {
    Button,
    Divider,
    Group,
    NumberInput,
    Radio,
    ScrollArea,
    SimpleGrid,
    Skeleton,
    Stack,
    Text,
    TextInput,
    UnstyledButton,
} from '@mantine/core';

import { MacroNutrients } from '@recipe/utils/nutrition';
import { USDA_SEARCH } from '@recipe/graphql/queries/nutritionalInfo';
import { GET_NUTRITIONAL_INFO_BY_INGREDIENT } from '@recipe/graphql/queries/nutritionalInfo';
import { CREATE_NUTRITIONAL_INFO } from '@recipe/graphql/mutations/nutritionalInfo';
import { UPDATE_NUTRITIONAL_INFO } from '@recipe/graphql/mutations/nutritionalInfo';
import { DELETE_NUTRITIONAL_INFO } from '@recipe/graphql/mutations/nutritionalInfo';

export interface UsdaLinkSectionProps {
    ingredientId?: string;
    isCountable?: boolean;
    disabled?: boolean;
}

const ZERO_MACROS: MacroNutrients = { calories: 0, protein: 0, carbs: 0, fat: 0 };

function round1(n: number | null | undefined): string {
    if (n == null) return '—';
    return n.toFixed(1).replace(/\.0$/, '');
}

export function UsdaLinkSection(props: UsdaLinkSectionProps) {
    const { ingredientId, isCountable, disabled } = props;

    const [searchInput, setSearchInput] = useState('');
    const [debouncedSearch] = useDebouncedValue(searchInput, 300);

    const [selectedFdcId, setSelectedFdcId] = useState<number | null>(null);
    const [pendingNutrition, setPendingNutrition] = useState<{
        fdcId: number;
        perGram: MacroNutrients;
    } | null>(null);
    const [perUnitNutrition, setPerUnitNutrition] = useState<MacroNutrients>(ZERO_MACROS);
    const [existingNutritionalInfoId, setExistingNutritionalInfoId] = useState<string | null>(null);
    const [linked, setLinked] = useState(false);

    // Load existing nutritional info (edit flow)
    useQuery(GET_NUTRITIONAL_INFO_BY_INGREDIENT, {
        variables: { ingredientId: ingredientId! },
        skip: !ingredientId,
        onCompleted: (data) => {
            const info = data.nutritionalInfoByIngredient;
            if (!info) return;
            setExistingNutritionalInfoId(info._id);
            setLinked(true);
            if (info.perGram) {
                setPendingNutrition({
                    fdcId: info.usdaFdcId ?? 0,
                    perGram: {
                        calories: info.perGram.calories,
                        protein: info.perGram.protein,
                        carbs: info.perGram.carbs,
                        fat: info.perGram.fat,
                    },
                });
            }
            if (info.perUnit) {
                setPerUnitNutrition({
                    calories: info.perUnit.calories,
                    protein: info.perUnit.protein,
                    carbs: info.perUnit.carbs,
                    fat: info.perUnit.fat,
                });
            }
        },
    });

    const [runSearch, { data: searchData, loading: searchLoading }] = useLazyQuery(USDA_SEARCH);

    const [createNutritionalInfo] = useMutation(CREATE_NUTRITIONAL_INFO, {
        onCompleted: (data) => {
            const id = data.nutritionalInfoCreateOne?.record?._id;
            if (id) setExistingNutritionalInfoId(id);
        },
    });

    const [updateNutritionalInfo] = useMutation(UPDATE_NUTRITIONAL_INFO);

    const [deleteNutritionalInfo] = useMutation(DELETE_NUTRITIONAL_INFO, {
        onCompleted: () => {
            setExistingNutritionalInfoId(null);
            setPendingNutrition(null);
            setPerUnitNutrition(ZERO_MACROS);
            setSelectedFdcId(null);
            setLinked(false);
            setSearchInput('');
        },
    });

    const handleSearch = () => {
        if (debouncedSearch.trim()) {
            runSearch({ variables: { query: debouncedSearch.trim(), pageSize: 20 } });
        }
    };

    const handleSelectResult = (fdcId: number) => {
        setSelectedFdcId(fdcId);
        const item = searchData?.usdaSearch?.find((r) => r != null && r.fdcId === fdcId);
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

    const handleLink = () => {
        if (!pendingNutrition || !ingredientId) return;

        const record: {
            ingredient: string;
            usdaFdcId?: number;
            perGram: MacroNutrients;
            perUnit?: MacroNutrients;
        } = {
            ingredient: ingredientId,
            usdaFdcId: pendingNutrition.fdcId || undefined,
            perGram: pendingNutrition.perGram,
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

        if (existingNutritionalInfoId) {
            updateNutritionalInfo({
                variables: { _id: existingNutritionalInfoId, record },
            });
        } else {
            createNutritionalInfo({ variables: { record } });
        }
        setLinked(true);
    };

    const handleClear = () => {
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

    const results = searchData?.usdaSearch?.filter((r) => r != null) ?? [];

    return (
        <Stack gap='sm'>
            <Divider label='Nutritional Data' labelPosition='left' />

            {linked && pendingNutrition ? (
                <Stack gap='xs'>
                    <Text size='sm' fw={500}>
                        Linked: FDC ID {pendingNutrition.fdcId || '(manual)'}
                    </Text>
                    <Text size='xs' c='dimmed'>
                        Per 100g: {round1(pendingNutrition.perGram.calories * 100)} kcal ·{' '}
                        {round1(pendingNutrition.perGram.protein * 100)}g protein ·{' '}
                        {round1(pendingNutrition.perGram.carbs * 100)}g carbs ·{' '}
                        {round1(pendingNutrition.perGram.fat * 100)}g fat
                    </Text>
                    {isCountable && (
                        <Text size='xs' c='dimmed'>
                            Per unit: {round1(perUnitNutrition.calories)} kcal ·{' '}
                            {round1(perUnitNutrition.protein)}g protein ·{' '}
                            {round1(perUnitNutrition.carbs)}g carbs ·{' '}
                            {round1(perUnitNutrition.fat)}g fat
                        </Text>
                    )}
                    <Button
                        size='xs'
                        variant='subtle'
                        color='red'
                        onClick={handleClear}
                        disabled={disabled || !ingredientId}
                        aria-label='Clear nutritional data link'
                    >
                        Clear
                    </Button>
                </Stack>
            ) : (
                <Stack gap='xs'>
                    <Group gap='xs' align='flex-end'>
                        <TextInput
                            placeholder='Search USDA FoodData Central...'
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.currentTarget.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            disabled={disabled || !ingredientId}
                            style={{ flex: 1 }}
                            aria-label='USDA search input'
                        />
                        <Button
                            size='sm'
                            onClick={handleSearch}
                            disabled={disabled || !ingredientId || !searchInput.trim()}
                            aria-label='Search USDA database'
                        >
                            Search
                        </Button>
                    </Group>

                    {!ingredientId && (
                        <Text size='xs' c='dimmed'>
                            Save the ingredient first to link nutritional data.
                        </Text>
                    )}

                    {searchLoading && (
                        <Stack gap='xs'>
                            <Skeleton height={40} />
                            <Skeleton height={40} />
                            <Skeleton height={40} />
                        </Stack>
                    )}

                    {!searchLoading && results.length > 0 && (
                        <ScrollArea h={200}>
                            <Radio.Group
                                value={selectedFdcId?.toString() ?? ''}
                                onChange={(val) => handleSelectResult(Number(val))}
                                aria-label='USDA search results'
                            >
                                <Stack gap='xs'>
                                    {results.map((item) => (
                                        <UnstyledButton
                                            key={item!.fdcId}
                                            onClick={() => handleSelectResult(item!.fdcId)}
                                            style={{ padding: '4px 0' }}
                                        >
                                            <Group gap='xs' align='flex-start'>
                                                <Radio value={item!.fdcId.toString()} />
                                                <Stack gap={2} style={{ flex: 1 }}>
                                                    <Text size='sm'>{item!.description}</Text>
                                                    {item!.brandOwner && (
                                                        <Text size='xs' c='dimmed'>
                                                            {item!.brandOwner}
                                                        </Text>
                                                    )}
                                                    <Text size='xs' c='dimmed'>
                                                        {round1(item!.caloriesPer100g)} kcal ·{' '}
                                                        {round1(item!.proteinPer100g)}g protein ·{' '}
                                                        {round1(item!.carbsPer100g)}g carbs ·{' '}
                                                        {round1(item!.fatPer100g)}g fat (per 100g)
                                                    </Text>
                                                </Stack>
                                            </Group>
                                        </UnstyledButton>
                                    ))}
                                </Stack>
                            </Radio.Group>
                        </ScrollArea>
                    )}

                    {isCountable && pendingNutrition && (
                        <Stack gap='xs'>
                            <Text size='sm' fw={500}>
                                Per unit nutritional data (optional)
                            </Text>
                            <SimpleGrid cols={2}>
                                <NumberInput
                                    label='Calories (kcal)'
                                    value={perUnitNutrition.calories}
                                    min={0}
                                    decimalScale={2}
                                    onChange={(val) =>
                                        setPerUnitNutrition((p) => ({
                                            ...p,
                                            calories: typeof val === 'number' ? val : 0,
                                        }))
                                    }
                                    disabled={disabled}
                                    aria-label='Per unit calories'
                                />
                                <NumberInput
                                    label='Protein (g)'
                                    value={perUnitNutrition.protein}
                                    min={0}
                                    decimalScale={2}
                                    onChange={(val) =>
                                        setPerUnitNutrition((p) => ({
                                            ...p,
                                            protein: typeof val === 'number' ? val : 0,
                                        }))
                                    }
                                    disabled={disabled}
                                    aria-label='Per unit protein'
                                />
                                <NumberInput
                                    label='Carbs (g)'
                                    value={perUnitNutrition.carbs}
                                    min={0}
                                    decimalScale={2}
                                    onChange={(val) =>
                                        setPerUnitNutrition((p) => ({
                                            ...p,
                                            carbs: typeof val === 'number' ? val : 0,
                                        }))
                                    }
                                    disabled={disabled}
                                    aria-label='Per unit carbs'
                                />
                                <NumberInput
                                    label='Fat (g)'
                                    value={perUnitNutrition.fat}
                                    min={0}
                                    decimalScale={2}
                                    onChange={(val) =>
                                        setPerUnitNutrition((p) => ({
                                            ...p,
                                            fat: typeof val === 'number' ? val : 0,
                                        }))
                                    }
                                    disabled={disabled}
                                    aria-label='Per unit fat'
                                />
                            </SimpleGrid>
                        </Stack>
                    )}

                    {pendingNutrition && (
                        <Group gap='xs'>
                            <Button
                                size='sm'
                                onClick={handleLink}
                                disabled={disabled || !ingredientId}
                                aria-label='Link selected nutritional data'
                            >
                                Link selected item
                            </Button>
                            <Button
                                size='sm'
                                variant='subtle'
                                color='red'
                                onClick={handleClear}
                                disabled={disabled}
                                aria-label='Clear nutritional data selection'
                            >
                                Clear
                            </Button>
                        </Group>
                    )}
                </Stack>
            )}
        </Stack>
    );
}
