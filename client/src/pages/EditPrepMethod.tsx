import { useState } from 'react';
import { FormLabel, Select } from '@chakra-ui/react';
import { Box, FormControl, Heading, VStack } from '@chakra-ui/react';

import { useSuccessToast } from '@recipe/common/hooks';
import { ModifyPrepMethodForm } from '@recipe/features/forms';
import { GET_PREP_METHODS } from '@recipe/graphql/queries/prepMethod';
import { useEditPermissionRecipeIngredients } from '@recipe/features/recipeIngredient';

export function EditPrepMethod() {
    const toast = useSuccessToast();
    const [currentPrepMethod, setCurrentPrepMethod] = useState<ModifyablePrepMethod>();
    const { data } = useEditPermissionRecipeIngredients(GET_PREP_METHODS);

    return (
        <VStack>
            <Box maxW='32em' mx='auto' mt={32} borderWidth='1px' borderRadius='lg' p={8}>
                <Heading pb={6}>Edit Prep Method</Heading>
                <form>
                    <VStack mt={0} spacing={8}>
                        <FormControl>
                            <FormLabel>Select prep method</FormLabel>
                            <Select
                                placeholder='-'
                                aria-label='Select prep method'
                                value={currentPrepMethod?._id}
                                onChange={(e) => {
                                    setCurrentPrepMethod(
                                        data?.prepMethodMany.find(
                                            (prep) => prep._id === e.target.value
                                        )
                                    );
                                }}
                            >
                                {data?.prepMethodMany.map((prep) => (
                                    <option key={prep._id} value={prep._id} aria-label={prep.value}>
                                        {prep.value}
                                    </option>
                                ))}
                            </Select>
                        </FormControl>
                        <ModifyPrepMethodForm
                            prepMethodId={currentPrepMethod?._id}
                            initData={currentPrepMethod}
                            disabled={!currentPrepMethod}
                            handleComplete={() => {
                                toast({
                                    title: 'Prep method saved',
                                    description: `${currentPrepMethod!.value} saved`,
                                    position: 'top',
                                });
                            }}
                            handleDelete={() => {
                                toast({ title: 'Prep method deleted', position: 'top' });
                                setCurrentPrepMethod(undefined);
                            }}
                            minW={296}
                        />
                    </VStack>
                </form>
            </Box>
        </VStack>
    );
}
