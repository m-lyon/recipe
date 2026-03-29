import { useState } from 'react';
import { TbAlertTriangle, TbChevronDown, TbChevronUp } from 'react-icons/tb';
import { Box, Collapse, Group, SimpleGrid, Skeleton, Text, UnstyledButton } from '@mantine/core';

import { useNutritionalInfo } from '../hooks/useNutritionalInfo';

interface NutritionalInfoPanelProps {
    subsections: IngredientSubsectionView[];
    numServings: number;
}

function round1(n: number): string {
    return n.toFixed(1).replace(/\.0$/, '');
}

export function NutritionalInfoPanel(props: NutritionalInfoPanelProps) {
    const { subsections, numServings } = props;
    const [open, setOpen] = useState(true);
    const { perServing, uncountedIds, loading } = useNutritionalInfo(subsections, numServings);

    const allUncounted =
        uncountedIds.size > 0 &&
        subsections
            .flatMap((s) => s.ingredients)
            .filter((i) => i.ingredient.__typename === 'Ingredient').length === uncountedIds.size;

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
                    <SimpleGrid cols={4} mt='xs'>
                        <Skeleton height={40} />
                        <Skeleton height={40} />
                        <Skeleton height={40} />
                        <Skeleton height={40} />
                    </SimpleGrid>
                ) : allUncounted ? (
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
                                    {uncountedIds.size !== 1 ? 's' : ''} could not be included
                                </Text>
                            </Group>
                        )}
                    </>
                )}
            </Collapse>
        </Box>
    );
}
