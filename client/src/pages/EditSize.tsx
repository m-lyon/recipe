import { useState } from 'react';
import { FormLabel, Select } from '@chakra-ui/react';
import { Box, FormControl, Heading, VStack } from '@chakra-ui/react';

import { Size } from '@recipe/graphql/generated';
import { useSuccessToast } from '@recipe/common/hooks';
import { GET_SIZES } from '@recipe/graphql/queries/size';
import { MODIFY_SIZE } from '@recipe/graphql/mutations/size';
import { SizeForm, useEditPermissionRecipeIngredients } from '@recipe/features/recipeIngredient';

export function EditSize() {
    const toast = useSuccessToast();
    const [currentSize, setCurrentSize] = useState<Size>();
    const { data } = useEditPermissionRecipeIngredients(GET_SIZES);

    return (
        <VStack>
            <Box maxW='32em' mx='auto' mt={32} borderWidth='1px' borderRadius='lg' p={8}>
                <Heading pb={6}>Edit Size</Heading>
                <form>
                    <VStack mt={0} spacing={8}>
                        <FormControl>
                            <FormLabel>Select prep method</FormLabel>
                            <Select
                                placeholder='-'
                                aria-label='Select prep method'
                                value={currentSize?._id}
                                onChange={(e) => {
                                    setCurrentSize(
                                        data?.sizeMany.find((prep) => prep._id === e.target.value)
                                    );
                                }}
                            >
                                {data?.sizeMany.map((prep) => (
                                    <option key={prep._id} value={prep._id} aria-label={prep.value}>
                                        {prep.value}
                                    </option>
                                ))}
                            </Select>
                        </FormControl>
                        <SizeForm
                            mutation={MODIFY_SIZE}
                            mutationVars={currentSize ? { id: currentSize._id } : { id: '' }}
                            initData={currentSize}
                            disabled={!currentSize}
                            handleComplete={() => {
                                toast({
                                    title: 'Size saved',
                                    description: `${currentSize!.value} saved`,
                                    position: 'top',
                                });
                            }}
                            handleDelete={() => {
                                toast({ title: 'Size deleted', position: 'top' });
                                setCurrentSize(undefined);
                            }}
                            minW={296}
                        />
                    </VStack>
                </form>
            </Box>
        </VStack>
    );
}
