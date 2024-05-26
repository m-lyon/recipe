import { useQuery } from '@apollo/client';
import { useContext, useState } from 'react';
import { FormLabel, Select } from '@chakra-ui/react';
import { Box, FormControl, Heading, VStack, useToast } from '@chakra-ui/react';

import { Unit } from '@recipe/graphql/generated';
import { UserContext } from '@recipe/features/user';
import { GET_UNITS } from '@recipe/graphql/queries/unit';
import { MODIFY_UNIT } from '@recipe/graphql/mutations/unit';
import { SubmitUnitForm } from '@recipe/features/recipeIngredient';

export function EditUnit() {
    const [userContext] = useContext(UserContext);
    const toast = useToast();
    const [currentUnit, setCurrentUnit] = useState<Unit>();
    const { data } = useQuery(GET_UNITS, {
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
                <Heading pb={6}>Edit Unit</Heading>
                <form>
                    <VStack mt={0} spacing={8}>
                        <FormControl>
                            <FormLabel>Select unit</FormLabel>
                            <Select
                                placeholder='-'
                                value={currentUnit?._id}
                                onChange={(e) => {
                                    setCurrentUnit(
                                        data?.unitMany.find((unit) => unit._id === e.target.value)
                                    );
                                }}
                            >
                                {data?.unitMany.map((unit) => (
                                    <option key={unit._id} value={unit._id}>
                                        {unit.longSingular}
                                    </option>
                                ))}
                            </Select>
                        </FormControl>
                        <SubmitUnitForm
                            mutation={MODIFY_UNIT}
                            mutationVariables={currentUnit ? { id: currentUnit._id } : undefined}
                            initialData={currentUnit}
                            isDisabled={!currentUnit}
                            paddingLeft={0}
                            handleComplete={() => {
                                toast({
                                    title: 'Unit saved',
                                    description: `${currentUnit?.longSingular} saved`,
                                    status: 'success',
                                    position: 'top',
                                    duration: 3000,
                                });
                            }}
                        />
                    </VStack>
                </form>
            </Box>
        </VStack>
    );
}
