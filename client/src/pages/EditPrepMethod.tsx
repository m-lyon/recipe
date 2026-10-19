import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { Box, Heading, VStack } from '@chakra-ui/react';

import { useSuccessToast } from '@recipe/common/hooks';
import { SearchableSelect } from '@recipe/common/components';
import { ModifyPrepMethodForm } from '@recipe/features/forms';
import { GET_EDITABLE_PREP_METHODS } from '@recipe/graphql/queries/prepMethod';

export function EditPrepMethod() {
    const toast = useSuccessToast();
    const [currentPrepMethod, setCurrentPrepMethod] = useState<ModifyablePrepMethodWithOwner>();
    const { data } = useQuery(GET_EDITABLE_PREP_METHODS);

    return (
        <VStack>
            <Box w='100%' maxW='32em' mx='auto' mt={32} borderWidth='1px' borderRadius='lg' p={8}>
                <Heading pb={6}>Edit Prep Method</Heading>
                <form>
                    <VStack mt={0} spacing={8} alignItems='stretch'>
                        <SearchableSelect
                            label='Select prep method'
                            aria-label='Select prep method'
                            options={(data?.prepMethodManyEditable ?? []).map((prep) => ({
                                value: prep._id,
                                label: prep.value,
                            }))}
                            value={currentPrepMethod?._id ?? null}
                            onChange={(id) => {
                                setCurrentPrepMethod(
                                    data?.prepMethodManyEditable.find((prep) => prep._id === id)
                                );
                            }}
                        />
                        <ModifyPrepMethodForm
                            prepMethodId={currentPrepMethod?._id}
                            initData={currentPrepMethod}
                            owner={currentPrepMethod?.owner}
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
