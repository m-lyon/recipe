import { useState } from 'react';
import { Box, Field, Heading, Select, VStack, createListCollection } from '@chakra-ui/react';

import { useSuccessToast } from '@recipe/common/hooks';
import { ModifyUnitForm } from '@recipe/features/forms';
import { GET_UNITS } from '@recipe/graphql/queries/unit';
import { useEditPermissionRecipeIngredients } from '@recipe/features/recipeIngredient';

export function EditUnit() {
    const toast = useSuccessToast();
    const [currentUnit, setCurrentUnit] = useState<ModifyableUnit>();
    const { data } = useEditPermissionRecipeIngredients(GET_UNITS);
    const unitCollection = createListCollection({ items: data?.unitMany || [] });

    return (
        <VStack>
            <Box maxW='32em' mx='auto' mt={32} borderWidth='1px' borderRadius='lg' p={8}>
                <Heading pb={6}>Edit Unit</Heading>
                <form>
                    <VStack mt={0} gap={8}>
                        <Field.Root>
                            <Field.Label>Select unit</Field.Label>
                            <Select.Root
                                collection={unitCollection}
                                value={currentUnit?._id}
                                onValueChange={(e) => {
                                    setCurrentUnit(
                                        unitCollection.items.find((unit) => unit._id === e.value)
                                    );
                                }}
                            >
                                <Select.HiddenSelect />
                                <Select.Control>
                                    <Select.Trigger>
                                        <Select.ValueText placeholder='-' />
                                    </Select.Trigger>
                                    <Select.IndicatorGroup>
                                        <Select.Indicator />
                                    </Select.IndicatorGroup>
                                </Select.Control>
                                <Select.Positioner>
                                    <Select.Content>
                                        {unitCollection.items.map((unit) => (
                                            <Select.Item
                                                key={unit._id}
                                                item={unit._id}
                                                aria-label={unit.longSingular}
                                            >
                                                {unit.longSingular}
                                            </Select.Item>
                                        ))}
                                    </Select.Content>
                                </Select.Positioner>
                            </Select.Root>
                        </Field.Root>
                        <ModifyUnitForm
                            unitId={currentUnit?._id}
                            initData={currentUnit}
                            disabled={!currentUnit}
                            handleComplete={() => {
                                toast({
                                    title: 'Unit saved',
                                    description: `${currentUnit?.longSingular} saved`,
                                    position: 'top',
                                });
                            }}
                            onDelete={() => {
                                toast({ title: 'Unit deleted', position: 'top' });
                                setCurrentUnit(undefined);
                            }}
                        />
                    </VStack>
                </form>
            </Box>
        </VStack>
    );
}
