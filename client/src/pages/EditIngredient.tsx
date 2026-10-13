import { useMemo, useState } from 'react';
import { useQuery } from '@apollo/client';
import { Box, Heading, VStack } from '@chakra-ui/react';

import { useSuccessToast } from '@recipe/common/hooks';
import { SearchableSelect } from '@recipe/common/components';
import { ModifyIngredientForm } from '@recipe/features/forms';
import { GET_EDITABLE_INGREDIENTS } from '@recipe/graphql/queries/ingredient';
import { GET_NUTRITIONAL_INFOS_BY_INGREDIENT_IDS } from '@recipe/graphql/queries/nutritionalInfo';

export function EditIngredient() {
    const toast = useSuccessToast();
    const [currentIngredient, setCurrentIngredient] = useState<ModifyableIngredient>();
    const { data } = useQuery(GET_EDITABLE_INGREDIENTS);

    // Fetch nutritional info for every ingredient up front, alongside the ingredient list
    // itself, so switching between ingredients doesn't need a per-ingredient loading state.
    const ingredientIds = useMemo(
        () => (data?.ingredientManyEditable ?? []).map((ingr) => ingr._id),
        [data]
    );
    const { data: nutritionalInfoData, refetch: refetchNutritionalInfo } = useQuery(
        GET_NUTRITIONAL_INFOS_BY_INGREDIENT_IDS,
        { variables: { ingredientIds }, skip: ingredientIds.length === 0 }
    );
    const existingNutritionalInfo = (
        nutritionalInfoData?.nutritionalInfosByIngredientIds ?? []
    ).find((info) => info?.ingredient === currentIngredient?._id);

    return (
        <VStack>
            <Box maxW='32em' mx='auto' mt={32} borderWidth='1px' borderRadius='lg' p={8}>
                <Heading pb={6}>Edit Ingredient</Heading>
                <form>
                    <VStack mt={0} spacing={8}>
                        <SearchableSelect
                            label='Select ingredient'
                            aria-label='Select ingredient'
                            options={(data?.ingredientManyEditable ?? []).map((ingr) => ({
                                value: ingr._id,
                                label: ingr.name,
                            }))}
                            value={currentIngredient?._id ?? null}
                            onChange={(id) => {
                                setCurrentIngredient(
                                    data?.ingredientManyEditable.find((ingr) => ingr._id === id)
                                );
                            }}
                        />
                        <ModifyIngredientForm
                            ingredientId={currentIngredient?._id}
                            initData={currentIngredient}
                            disabled={!currentIngredient}
                            existingNutritionalInfo={existingNutritionalInfo}
                            onNutritionalInfoChange={() => refetchNutritionalInfo()}
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
