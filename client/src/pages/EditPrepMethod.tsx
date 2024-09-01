import { useQuery } from '@apollo/client';
import { useContext, useState } from 'react';
import { FormLabel, Select } from '@chakra-ui/react';
import { Box, FormControl, Heading, VStack } from '@chakra-ui/react';

import { UniquePrepMethod } from '@recipe/types';
import { UserContext } from '@recipe/features/user';
import { useSuccessToast } from '@recipe/common/hooks';
import { PrepMethodForm } from '@recipe/features/recipeIngredient';
import { GET_PREP_METHODS } from '@recipe/graphql/queries/prepMethod';
import { MODIFY_PREP_METHOD } from '@recipe/graphql/mutations/prepMethod';

export function EditPrepMethod() {
    const [userContext] = useContext(UserContext);
    const toast = useSuccessToast();
    const [currentPrepMethod, setCurrentPrepMethod] = useState<UniquePrepMethod>();
    const { data } = useQuery(GET_PREP_METHODS, {
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
                        <PrepMethodForm
                            mutation={MODIFY_PREP_METHOD}
                            mutationVars={
                                currentPrepMethod ? { id: currentPrepMethod._id } : { id: '' }
                            }
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
