import { useState } from 'react';
import { Box, Field, Heading, Select, VStack, createListCollection } from '@chakra-ui/react';

import { useSuccessToast } from '@recipe/common/hooks';
import { ModifyPrepMethodForm } from '@recipe/features/forms';
import { GET_PREP_METHODS } from '@recipe/graphql/queries/prepMethod';
import { useEditPermissionRecipeIngredients } from '@recipe/features/recipeIngredient';

export function EditPrepMethod() {
    const toast = useSuccessToast();
    const [currentPrepMethod, setCurrentPrepMethod] = useState<ModifyablePrepMethod>();
    const { data } = useEditPermissionRecipeIngredients(GET_PREP_METHODS);
    const prepMethodCollection = createListCollection({ items: data?.prepMethodMany || [] });

    return (
        <VStack>
            <Box maxW='32em' mx='auto' mt={32} borderWidth='1px' borderRadius='lg' p={8}>
                <Heading pb={6}>Edit Prep Method</Heading>
                <form>
                    <VStack mt={0} gap={8}>
                        <Field.Root>
                            <Field.Label>Select prep method</Field.Label>
                            <Select.Root
                                collection={prepMethodCollection}
                                value={currentPrepMethod?._id}
                                onValueChange={(e) => {
                                    setCurrentPrepMethod(
                                        prepMethodCollection.items.find(
                                            (prep) => prep._id === e.value
                                        )
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
                                        {prepMethodCollection.items.map((prep) => (
                                            <Select.Item
                                                key={prep._id}
                                                item={prep._id}
                                                aria-label={prep.value}
                                            >
                                                {prep.value}
                                            </Select.Item>
                                        ))}
                                    </Select.Content>
                                </Select.Positioner>
                            </Select.Root>
                        </Field.Root>
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
                            onDelete={() => {
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
