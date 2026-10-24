import { useState } from 'react';
import { Link } from 'react-router-dom';
import { UnstyledButton } from '@mantine/core';
import { TbAlertTriangle, TbChevronDown, TbChevronUp } from 'react-icons/tb';
import { Anchor, Box, Collapse, Group, SimpleGrid, Skeleton, Text } from '@mantine/core';

import { PATH } from '@recipe/constants';
import { MacroNutrients } from '@recipe/utils/macros';
import { DisplayedIngredient } from '@recipe/features/servings';
import { getFinishedRecipeIngredientStr } from '@recipe/utils/formatting';

import { UncountedIngredientPrompt } from './UncountedIngredientPrompt';
import { PartialIngredient, UncountedIngredient } from '../hooks/useNutritionalInfo';

interface NutritionalInfoPanelProps {
    perServing: MacroNutrients;
    uncountedIds: Set<string>;
    uncounted?: UncountedIngredient[];
    /** Recipes used as ingredients, with some ingredients of their own not counted. */
    partial?: PartialIngredient[];
    canEditIngredient?: (ingredientId: string) => boolean;
    /** Whether the viewer may edit a recipe with this owner, to offer adding a missing yield. */
    canEditRecipe?: (ownerId: string) => boolean;
    displayLine?: (item: RecipeIngredientView) => DisplayedIngredient;
    /** True when no ingredient contributed to the totals (none countable, or none present). */
    nothingCounted: boolean;
    loading: boolean;
    error?: boolean;
}

function round1(n: number): string {
    return n.toFixed(1).replace(/\.0$/, '');
}

/** "No weight recorded for…" reads as "no weight recorded for…" after a dash. */
function lowerFirst(text: string): string {
    return text.charAt(0).toLowerCase() + text.slice(1);
}

/** The used recipe's page: its own panel shows what it leaves out. */
function recipeLink(item: RecipeIngredientView, action: 'view' | 'edit'): string | null {
    const used = item.ingredient;
    return used.__typename === 'Recipe'
        ? `${PATH.BASE}/${action}/recipe/${used.titleIdentifier}`
        : null;
}

export function NutritionalInfoPanel(props: NutritionalInfoPanelProps) {
    const { perServing, uncountedIds, uncounted = [], nothingCounted, loading, error } = props;
    const { partial = [], canEditIngredient = () => false, canEditRecipe = () => false } = props;
    const { displayLine = (item) => ({ ...item, authored: null }) } = props;
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
                ) : error ? (
                    <Text c='dimmed' mt='xs'>
                        Nutritional info could not be loaded.
                    </Text>
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
                                <Text fw={500}>{Math.round(perServing.calories)}</Text>
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
                        {(uncountedIds.size > 0 || partial.length > 0) && (
                            <Group mt='xs' gap='xs'>
                                <TbAlertTriangle color='orange' />
                                <Text size='sm' c='dimmed'>
                                    {[
                                        uncountedIds.size > 0 &&
                                            `Not counted: ${uncountedIds.size} ingredient${uncountedIds.size !== 1 ? 's' : ''}`,
                                        partial.length > 0 && `${partial.length} partly counted`,
                                    ]
                                        .filter(Boolean)
                                        .join(' · ')}
                                </Text>
                            </Group>
                        )}
                        {uncounted.map((uncountedIngredient) => {
                            const shown = displayLine(uncountedIngredient.item);
                            return (
                                <Box key={uncountedIngredient.item._id} mt='xs' ml='lg'>
                                    <Text size='sm'>
                                        {shown.authored ? '≈ ' : ''}
                                        {getFinishedRecipeIngredientStr(shown).trim()}
                                        <Text span size='sm' c='dimmed'>
                                            {' '}
                                            — {lowerFirst(uncountedIngredient.reason)}
                                        </Text>
                                    </Text>
                                    {uncountedIngredient.code === 'NO_MEASURE' &&
                                        canEditIngredient(
                                            uncountedIngredient.item.ingredient._id
                                        ) && (
                                            <UncountedIngredientPrompt
                                                uncounted={uncountedIngredient}
                                            />
                                        )}
                                    {uncountedIngredient.code === 'NO_YIELD' &&
                                        uncountedIngredient.item.ingredient.__typename ===
                                            'Recipe' &&
                                        canEditRecipe(
                                            uncountedIngredient.item.ingredient.owner
                                        ) && (
                                            <Anchor
                                                component={Link}
                                                to={
                                                    recipeLink(uncountedIngredient.item, 'edit') ??
                                                    ''
                                                }
                                                size='sm'
                                            >
                                                Add a yield
                                            </Anchor>
                                        )}
                                </Box>
                            );
                        })}
                        {partial.map((partialIngredient) => {
                            const shown = displayLine(partialIngredient.item);
                            const to = recipeLink(partialIngredient.item, 'view');
                            return (
                                <Box key={partialIngredient.item._id} mt='xs' ml='lg'>
                                    <Text size='sm'>
                                        {shown.authored ? '≈ ' : ''}
                                        {getFinishedRecipeIngredientStr(shown).trim()}
                                        <Text span size='sm' c='dimmed'>
                                            {' '}
                                            — {lowerFirst(partialIngredient.reason)}
                                        </Text>
                                    </Text>
                                    {to && (
                                        <Anchor component={Link} to={to} size='sm'>
                                            View its nutrition
                                        </Anchor>
                                    )}
                                </Box>
                            );
                        })}
                    </>
                )}
            </Collapse>
        </Box>
    );
}
