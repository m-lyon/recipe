import { useState } from 'react';
import { Box, Heading, VStack } from '@chakra-ui/react';

import { useSuccessToast } from '@recipe/common/hooks';
import { SearchableSelect } from '@recipe/common/components';
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
                        <SearchableSelect
                            label='Select prep method'
                            aria-label='Select prep method'
                            options={(data?.prepMethodMany ?? []).map((prep) => ({
                                value: prep._id,
                                label: prep.value,
                            }))}
                            value={currentPrepMethod?._id ?? null}
                            onChange={(id) => {
                                setCurrentPrepMethod(
                                    data?.prepMethodMany.find((prep) => prep._id === id)
                                );
                            }}
                        />
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
