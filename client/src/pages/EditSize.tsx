import { useState } from 'react';
import { Box, Field, Heading, Select, VStack, createListCollection } from '@chakra-ui/react';

import { useSuccessToast } from '@recipe/common/hooks';
import { ModifySizeForm } from '@recipe/features/forms';
import { GET_SIZES } from '@recipe/graphql/queries/size';
import { useEditPermissionRecipeIngredients } from '@recipe/features/recipeIngredient';

export function EditSize() {
    const toast = useSuccessToast();
    const [currentSize, setCurrentSize] = useState<ModifyableSize>();
    const { data } = useEditPermissionRecipeIngredients(GET_SIZES);
    const sizeCollection = createListCollection({ items: data?.sizeMany || [] });

    return (
        <VStack>
            <Box maxW='32em' mx='auto' mt={32} borderWidth='1px' borderRadius='lg' p={8}>
                <Heading pb={6}>Edit Size</Heading>
                <form>
                    <VStack mt={0} gap={8}>
                        <Field.Root>
                            <Field.Label>Select size</Field.Label>
                            <Select.Root
                                collection={sizeCollection}
                                value={currentSize?._id}
                                onValueChange={(e) => {
                                    setCurrentSize(
                                        sizeCollection.items.find((size) => size._id === e.value)
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
                                        {sizeCollection.items.map((size) => (
                                            <Select.Item
                                                key={size._id}
                                                item={size._id}
                                                aria-label={size.value}
                                            >
                                                {size.value}
                                            </Select.Item>
                                        ))}
                                    </Select.Content>
                                </Select.Positioner>
                            </Select.Root>
                        </Field.Root>
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
