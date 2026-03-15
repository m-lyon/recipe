import { useState } from 'react';
import { Box, Heading, VStack } from '@chakra-ui/react';

import { useSuccessToast } from '@recipe/common/hooks';
import { SearchableSelect } from '@recipe/common/components';
import { ModifyIngredientForm } from '@recipe/features/forms';
import { GET_INGREDIENTS } from '@recipe/graphql/queries/ingredient';
import { useEditPermissionRecipeIngredients } from '@recipe/features/recipeIngredient';

export function EditIngredient() {
    const toast = useSuccessToast();
    const [currentIngredient, setCurrentIngredient] = useState<ModifyableIngredient>();
    const { data } = useEditPermissionRecipeIngredients(GET_INGREDIENTS);

    return (
        <VStack>
            <Box maxW='32em' mx='auto' mt={32} borderWidth='1px' borderRadius='lg' p={8}>
                <Heading pb={6}>Edit Ingredient</Heading>
                <form>
                    <VStack mt={0} spacing={8}>
                        <SearchableSelect
                            label='Select ingredient'
                            aria-label='Select ingredient'
                            options={(data?.ingredientMany ?? []).map((ingr) => ({
                                value: ingr._id,
                                label: ingr.name,
                            }))}
                            value={currentIngredient?._id ?? null}
                            onChange={(id) => {
                                setCurrentIngredient(
                                    data?.ingredientMany.find((ingr) => ingr._id === id)
                                );
                            }}
                        />
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
