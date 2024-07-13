import { useQuery } from '@apollo/client';
import { useContext, useState } from 'react';
import { FormLabel, Select } from '@chakra-ui/react';
import { Box, FormControl, Heading, VStack, useToast } from '@chakra-ui/react';

import { DELAY_LONG } from '@recipe/constants';
import { UserContext } from '@recipe/features/user';
import { Ingredient } from '@recipe/graphql/generated';
import { IngredientForm } from '@recipe/features/recipeIngredient';
import { GET_INGREDIENTS } from '@recipe/graphql/queries/ingredient';
import { MODIFY_INGREDIENT } from '@recipe/graphql/mutations/ingredient';

export function EditIngredient() {
    const [userContext] = useContext(UserContext);
    const toast = useToast();
    const [currentIngredient, setCurrentIngredient] = useState<Ingredient>();
    const { data } = useQuery(GET_INGREDIENTS, {
        variables: {
            filter: userContext
                ? userContext.role === 'admin'
                    ? {}
                    : { owner: userContext._id }
                : undefined,
        },
    });

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
                                    status: 'success',
                                    position: 'top',
                                    duration: DELAY_LONG,
                                });
                            }}
                            handleDelete={() => {
                                toast({
                                    title: 'Ingredient deleted',
                                    status: 'success',
                                });
                                setCurrentIngredient(undefined);
                            }}
                        />
                    </VStack>
                </form>
            </Box>
        </VStack>
    );
}
