import { useState } from 'react';
import { Box, Field, Heading, Select, VStack, createListCollection } from '@chakra-ui/react';

import { useSuccessToast } from '@recipe/common/hooks';
import { ModifyIngredientForm } from '@recipe/features/forms';
import { GET_INGREDIENTS } from '@recipe/graphql/queries/ingredient';
import { useEditPermissionRecipeIngredients } from '@recipe/features/recipeIngredient';

export function EditIngredient() {
    const toast = useSuccessToast();
    const [currentIngredient, setCurrentIngredient] = useState<ModifyableIngredient>();
    const { data } = useEditPermissionRecipeIngredients(GET_INGREDIENTS);
    const ingrCollection = createListCollection({ items: data?.ingredientMany || [] });
    return (
        <VStack>
            <Box maxW='32em' mx='auto' mt={32} borderWidth='1px' borderRadius='lg' p={8}>
                <Heading pb={6}>Edit Ingredient</Heading>
                <form>
                    <VStack mt={0} gap={8}>
                        <Field.Root>
                            <Field.Label>Select ingredient</Field.Label>
                            <Select.Root
                                collection={ingrCollection}
                                value={currentIngredient?._id}
                                onValueChange={(e) => {
                                    setCurrentIngredient(
                                        ingrCollection.items.find((ingr) => ingr._id === e.value)
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
                                        {ingrCollection.items.map((ingr) => (
                                            <Select.Item
                                                key={ingr._id}
                                                item={ingr._id}
                                                aria-label={ingr.name}
                                            >
                                                {ingr.name}
                                            </Select.Item>
                                        ))}
                                    </Select.Content>
                                </Select.Positioner>
                            </Select.Root>
                        </Field.Root>
                        <ModifyIngredientForm
                            ingredientId={currentIngredient?._id}
                            initData={currentIngredient}
                            disabled={!currentIngredient}
                            handleComplete={() => {
                                toast({
                                    title: 'Ingredient saved',
                                    description: `${currentIngredient!.name} saved`,
                                    position: 'top',
                                });
                            }}
                            onDelete={() => {
                                toast({ title: 'Ingredient deleted' });
                                setCurrentIngredient(undefined);
                            }}
                        />
                    </VStack>
                </form>
            </Box>
        </VStack>
    );
}
