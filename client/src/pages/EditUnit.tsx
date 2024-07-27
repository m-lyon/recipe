import { useQuery } from '@apollo/client';
import { useContext, useState } from 'react';
import { FormLabel, Select } from '@chakra-ui/react';
import { Box, FormControl, Heading, VStack } from '@chakra-ui/react';

import { Unit } from '@recipe/graphql/generated';
import { UserContext } from '@recipe/features/user';
import { useSuccessToast } from '@recipe/common/hooks';
import { GET_UNITS } from '@recipe/graphql/queries/unit';
import { MODIFY_UNIT } from '@recipe/graphql/mutations/unit';
import { UnitForm } from '@recipe/features/recipeIngredient';

export function EditUnit() {
    const [userContext] = useContext(UserContext);
    const toast = useSuccessToast();
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
                                aria-label='Select unit'
                                value={currentUnit?._id}
                                onChange={(e) => {
                                    setCurrentUnit(
                                        data?.unitMany.find((unit) => unit._id === e.target.value)
                                    );
                                }}
                            >
                                {data?.unitMany.map((unit) => (
                                    <option
                                        key={unit._id}
                                        value={unit._id}
                                        aria-label={unit.longSingular}
                                    >
                                        {unit.longSingular}
                                    </option>
                                ))}
                            </Select>
                        </FormControl>
                        <UnitForm
                            mutation={MODIFY_UNIT}
                            mutationVars={currentUnit ? { id: currentUnit._id } : { id: '' }}
                            initData={currentUnit}
                            disabled={!currentUnit}
                            handleComplete={() => {
                                toast({
                                    title: 'Unit saved',
                                    description: `${currentUnit?.longSingular} saved`,
                                    position: 'top',
                                });
                            }}
                            handleDelete={() => {
                                toast({ title: 'Unit deleted', position: 'top' });
                                setCurrentUnit(undefined);
                            }}
                        />
                    </VStack>
                </form>
            </Box>
        </VStack>
    );
}
