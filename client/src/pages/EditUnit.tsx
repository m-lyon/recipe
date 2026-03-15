import { useState } from 'react';
import { Box, Heading, VStack } from '@chakra-ui/react';

import { useSuccessToast } from '@recipe/common/hooks';
import { ModifyUnitForm } from '@recipe/features/forms';
import { GET_UNITS } from '@recipe/graphql/queries/unit';
import { SearchableSelect } from '@recipe/common/components';
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
                        <SearchableSelect
                            label='Select unit'
                            aria-label='Select unit'
                            options={(data?.unitMany ?? []).map((unit) => ({
                                value: unit._id,
                                label: unit.longSingular,
                            }))}
                            value={currentUnit?._id ?? null}
                            onChange={(id) => {
                                setCurrentUnit(data?.unitMany.find((unit) => unit._id === id));
                            }}
                        />
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
                            onDelete={() => {
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
