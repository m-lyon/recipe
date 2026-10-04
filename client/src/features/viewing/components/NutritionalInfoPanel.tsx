import { useState } from 'react';
import { TbAlertTriangle, TbChevronDown, TbChevronUp } from 'react-icons/tb';
import { Box, Collapse, Group, SimpleGrid, Skeleton, Text, UnstyledButton } from '@mantine/core';

import { getFinishedRecipeIngredientStr } from '@recipe/utils/formatting';
import { MacroNutrients, UncountedIngredient } from '@recipe/utils/nutrition';

import { UncountedIngredientPrompt } from './UncountedIngredientPrompt';

interface NutritionalInfoPanelProps {
    perServing: MacroNutrients;
    uncountedIds: Set<string>;
    /** The uncounted lines with the reason each one was left out. */
    uncounted?: UncountedIngredient[];
    /** True when the reader may add a measure to the ingredient. */
    canEditIngredient?: (ingredientId: string) => boolean;
    /** Called after a measure is saved from the panel, to recalculate. */
    onMeasureSaved?: () => void;
    /** True when no ingredient contributed to the totals (none countable, or none present). */
    nothingCounted: boolean;
    loading: boolean;
}

function round1(n: number): string {
    return n.toFixed(1).replace(/\.0$/, '');
}

export function NutritionalInfoPanel(props: NutritionalInfoPanelProps) {
    const { perServing, uncountedIds, uncounted = [], nothingCounted, loading } = props;
    const { canEditIngredient = () => false, onMeasureSaved = () => {} } = props;
    const [open, setOpen] = useState(true);

    return (
        <Box mt='sm'>
            <UnstyledButton
                onClick={() => setOpen((o) => !o)}
                style={{ width: '100%' }}
                aria-expanded={open}
                aria-controls='nutrition-panel-content'
            >
                <Group justify='space-between'>
                    <Text fw={600}>Nutritional Info (per serving)</Text>
                    {open ? <TbChevronUp /> : <TbChevronDown />}
                </Group>
            </UnstyledButton>

            <Collapse in={open} id='nutrition-panel-content'>
                {loading ? (
                    <SimpleGrid cols={1} mt='xs' spacing='xs'>
                        <Skeleton height={10} />
                        <Skeleton height={10} />
                        <Skeleton height={10} width='70%' />
                    </SimpleGrid>
                ) : nothingCounted ? (
                    <Text c='dimmed' mt='xs'>
                        Nutritional info not available for this recipe yet.
                    </Text>
                ) : (
                    <>
                        <SimpleGrid cols={4} mt='xs'>
                            <Box>
                                <Text size='xs' c='dimmed'>
                                    Calories
                                </Text>
                                <Text fw={500}>{Math.round(perServing.calories)} kcal</Text>
                            </Box>
                            <Box>
                                <Text size='xs' c='dimmed'>
                                    Protein
                                </Text>
                                <Text fw={500}>{round1(perServing.protein)} g</Text>
                            </Box>
                            <Box>
                                <Text size='xs' c='dimmed'>
                                    Carbs
                                </Text>
                                <Text fw={500}>{round1(perServing.carbs)} g</Text>
                            </Box>
                            <Box>
                                <Text size='xs' c='dimmed'>
                                    Fat
                                </Text>
                                <Text fw={500}>{round1(perServing.fat)} g</Text>
                            </Box>
                        </SimpleGrid>
                        {uncountedIds.size > 0 && (
                            <Group mt='xs' gap='xs'>
                                <TbAlertTriangle color='orange' />
                                <Text size='sm' c='dimmed'>
                                    Not counted: {uncountedIds.size} ingredient
                                    {uncountedIds.size !== 1 ? 's' : ''}
                                </Text>
                            </Group>
                        )}
                        {uncounted.map((line) => (
                            <Box key={line.item._id} mt='xs' ml='lg'>
                                <Text size='sm'>
                                    {getFinishedRecipeIngredientStr(line.item).trim()}
                                    <Text span size='sm' c='dimmed'>
                                        {' '}
                                        — {line.reason.toLowerCase()}
                                    </Text>
                                </Text>
                                {line.missingMeasure &&
                                    canEditIngredient(line.item.ingredient._id) && (
                                        <UncountedIngredientPrompt
                                            uncounted={line}
                                            onSaved={onMeasureSaved}
                                        />
                                    )}
                            </Box>
                        ))}
                    </>
                )}
            </Collapse>
        </Box>
    );
}
