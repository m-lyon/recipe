import { useState } from 'react';
import { FormLabel, Select } from '@chakra-ui/react';
import { Box, FormControl, Heading, VStack } from '@chakra-ui/react';

import { useSuccessToast } from '@recipe/common/hooks';
import { Ingredient } from '@recipe/graphql/generated';
import { IngredientForm } from '@recipe/features/recipeIngredient';
import { GET_INGREDIENTS } from '@recipe/graphql/queries/ingredient';
import { MODIFY_INGREDIENT } from '@recipe/graphql/mutations/ingredient';
import { useEditPermissionRecipeIngredients } from '@recipe/features/recipeIngredient';

export function EditIngredient() {
    const toast = useSuccessToast();
    const [currentIngredient, setCurrentIngredient] = useState<Ingredient>();
    const { data } = useEditPermissionRecipeIngredients(GET_INGREDIENTS);

    return (
        <VStack>
            <Box maxW='32em' mx='auto' mt={32} borderWidth='1px' borderRadius='lg' p={8}>
                <Heading pb={6}>Edit Ingredient</Heading>
                <form>
                    <VStack mt={0} spacing={8}>
                        <FormControl>
                            <FormLabel>Select ingredient</FormLabel>
                            <Select
                                placeholder='-'
                                aria-label='Select ingredient'
                                value={currentIngredient?._id}
                                onChange={(e) => {
                                    setCurrentIngredient(
                                        data?.ingredientMany.find(
                                            (ingr) => ingr._id === e.target.value
                                        )
                                    );
                                }}
                            >
                                {data?.ingredientMany.map((ingr) => (
                                    <option key={ingr._id} value={ingr._id} aria-label={ingr.name}>
                                        {ingr.name}
                                    </option>
                                ))}
                            </Select>
                        </FormControl>
                        <IngredientForm
                            mutation={MODIFY_INGREDIENT}
                            mutationVars={
                                currentIngredient ? { id: currentIngredient._id } : { id: '' }
                            }
                            initData={currentIngredient}
                            disabled={!currentIngredient}
                            handleComplete={() => {
                                toast({
                                    title: 'Ingredient saved',
                                    description: `${currentIngredient!.name} saved`,
                                    position: 'top',
                                });
                            }}
                            handleDelete={() => {
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
