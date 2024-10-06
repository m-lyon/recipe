import { useState } from 'react';
import { FormLabel, Select } from '@chakra-ui/react';
import { Box, FormControl, Heading, VStack } from '@chakra-ui/react';

import { useSuccessToast } from '@recipe/common/hooks';
import { ModifyUnitForm } from '@recipe/features/forms';
import { GET_UNITS } from '@recipe/graphql/queries/unit';
import { useEditPermissionRecipeIngredients } from '@recipe/features/recipeIngredient';

export function EditUnit() {
    const toast = useSuccessToast();
    const [currentUnit, setCurrentUnit] = useState<ModifyableUnit>();
    const { data } = useEditPermissionRecipeIngredients(GET_UNITS);

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
                        <ModifyUnitForm
                            unitId={currentUnit?._id}
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
