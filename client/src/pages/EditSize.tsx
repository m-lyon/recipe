import { useState } from 'react';
import { FormLabel, Select } from '@chakra-ui/react';
import { Box, FormControl, Heading, VStack } from '@chakra-ui/react';

import { useSuccessToast } from '@recipe/common/hooks';
import { ModifySizeForm } from '@recipe/features/forms';
import { GET_SIZES } from '@recipe/graphql/queries/size';
import { useEditPermissionRecipeIngredients } from '@recipe/features/recipeIngredient';

export function EditSize() {
    const toast = useSuccessToast();
    const [currentSize, setCurrentSize] = useState<ModifyableSize>();
    const { data } = useEditPermissionRecipeIngredients(GET_SIZES);

    return (
        <VStack>
            <Box maxW='32em' mx='auto' mt={32} borderWidth='1px' borderRadius='lg' p={8}>
                <Heading pb={6}>Edit Size</Heading>
                <form>
                    <VStack mt={0} gap={8}>
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
                        <ModifySizeForm
                            sizeId={currentSize?._id}
                            initData={currentSize}
                            disabled={!currentSize}
                            handleComplete={() => {
                                toast({
                                    title: 'Size saved',
                                    description: `${currentSize!.value} saved`,
                                    position: 'top',
                                });
                            }}
                            onDelete={() => {
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
