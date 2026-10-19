import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { Box, Heading, VStack } from '@chakra-ui/react';

import { useSuccessToast } from '@recipe/common/hooks';
import { ModifySizeForm } from '@recipe/features/forms';
import { SearchableSelect } from '@recipe/common/components';
import { GET_EDITABLE_SIZES } from '@recipe/graphql/queries/size';

export function EditSize() {
    const toast = useSuccessToast();
    const [currentSize, setCurrentSize] = useState<ModifyableSizeWithOwner>();
    const { data } = useQuery(GET_EDITABLE_SIZES);

    return (
        <VStack>
            <Box w='100%' maxW='32em' mx='auto' mt={32} borderWidth='1px' borderRadius='lg' p={8}>
                <Heading pb={6}>Edit Size</Heading>
                <form>
                    <VStack mt={0} spacing={8} alignItems='stretch'>
                        <SearchableSelect
                            label='Select size'
                            aria-label='Select size'
                            options={(data?.sizeManyEditable ?? []).map((size) => ({
                                value: size._id,
                                label: size.value,
                            }))}
                            value={currentSize?._id ?? null}
                            onChange={(id) => {
                                setCurrentSize(
                                    data?.sizeManyEditable.find((size) => size._id === id)
                                );
                            }}
                        />
                        <ModifySizeForm
                            sizeId={currentSize?._id}
                            initData={currentSize}
                            owner={currentSize?.owner}
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
