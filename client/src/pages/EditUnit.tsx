import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { Box, Heading, VStack } from '@chakra-ui/react';

import { useSuccessToast } from '@recipe/common/hooks';
import { ModifyUnitForm } from '@recipe/features/forms';
import { SearchableSelect } from '@recipe/common/components';
import { GET_EDITABLE_UNITS } from '@recipe/graphql/queries/unit';

export function EditUnit() {
    const toast = useSuccessToast();
    const [currentUnit, setCurrentUnit] = useState<ModifyableUnitWithOwner>();
    const { data } = useQuery(GET_EDITABLE_UNITS);

    return (
        <VStack>
            <Box w='100%' maxW='32em' mx='auto' mt={32} borderWidth='1px' borderRadius='lg' p={8}>
                <Heading pb={6}>Edit Unit</Heading>
                <form>
                    <VStack mt={0} spacing={8} alignItems='stretch'>
                        <SearchableSelect
                            label='Select unit'
                            aria-label='Select unit'
                            options={(data?.unitManyEditable ?? []).map((unit) => ({
                                value: unit._id,
                                label: unit.longSingular,
                            }))}
                            value={currentUnit?._id ?? null}
                            onChange={(id) => {
                                setCurrentUnit(
                                    data?.unitManyEditable.find((unit) => unit._id === id)
                                );
                            }}
                        />
                        <ModifyUnitForm
                            unitId={currentUnit?._id}
                            initData={currentUnit}
                            owner={currentUnit?.owner}
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
