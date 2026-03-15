import { useState } from 'react';
import { Box, Heading, VStack } from '@chakra-ui/react';

import { useSuccessToast } from '@recipe/common/hooks';
import { ModifySizeForm } from '@recipe/features/forms';
import { GET_SIZES } from '@recipe/graphql/queries/size';
import { SearchableSelect } from '@recipe/common/components';
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
                    <VStack mt={0} spacing={8}>
                        <SearchableSelect
                            label='Select size'
                            aria-label='Select size'
                            options={(data?.sizeMany ?? []).map((size) => ({
                                value: size._id,
                                label: size.value,
                            }))}
                            value={currentSize?._id ?? null}
                            onChange={(id) => {
                                setCurrentSize(data?.sizeMany.find((size) => size._id === id));
                            }}
                        />
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
