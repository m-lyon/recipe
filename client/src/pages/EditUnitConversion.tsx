import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { Box, Button, ButtonGroup, Heading, VStack } from '@chakra-ui/react';

import { GET_UNITS } from '@recipe/graphql/queries/unit';
import { SearchableSelect } from '@recipe/common/components';
import { CreateConversionRuleForm } from '@recipe/features/forms';
import { useErrorToast, useSuccessToast } from '@recipe/common/hooks';
import { ConversionRule, ConversionRuleList } from '@recipe/features/forms';
import { GET_UNIT_CONVERSIONS } from '@recipe/graphql/queries/unitConversion';
import { REMOVE_CONVERSION_RULE } from '@recipe/graphql/mutations/unitConversion';
import { REMOVE_UNIT_CONVERSION } from '@recipe/graphql/mutations/unitConversion';
import { UPDATE_UNIT_CONVERSION } from '@recipe/graphql/mutations/unitConversion';

export function EditUnitConversion() {
    const [currentId, setCurrentId] = useState<string | null>(null);
    const { data: unitData } = useQuery(GET_UNITS);
    const { data } = useQuery(GET_UNIT_CONVERSIONS);
    const [updateUnitConversion] = useMutation(UPDATE_UNIT_CONVERSION);
    const [removeConversionRule] = useMutation(REMOVE_CONVERSION_RULE);
    const [removeUnitConversion, { loading: deleting }] = useMutation(REMOVE_UNIT_CONVERSION, {
        update: (cache, { data }) => {
            cache.evict({ id: `UnitConversion:${data?.unitConversionRemoveById?.recordId}` });
            cache.gc();
        },
    });
    const errorToast = useErrorToast();
    const successToast = useSuccessToast();

    // Read from the query so the page re-renders when the mutations update the cache
    const current = data?.unitConversionMany.find((c) => c._id === currentId);
    const ruleIds = current?.rules.map((r) => r._id) ?? [];

    const showError = (err: unknown) => {
        if (err instanceof Error) {
            console.error(err);
            errorToast({ title: 'An error occurred.', description: err.message, position: 'top' });
        }
    };

    const handleAddRule = async (rule: ConversionRule) => {
        if (!current) return;
        try {
            await updateUnitConversion({
                variables: { id: current._id, record: { rules: [...ruleIds, rule._id] } },
            });
        } catch (err) {
            // Don't leave an orphaned rule behind, it would block reusing its unit
            await removeConversionRule({ variables: { id: rule._id } }).catch(console.error);
            throw err;
        }
    };

    const handleRemoveRule = async (rule: ConversionRule) => {
        if (!current) return;
        if (ruleIds.length === 1) {
            errorToast({
                title: 'Cannot remove the last rule',
                description: 'A unit conversion needs at least one rule, delete it instead',
                position: 'top',
            });
            return;
        }
        try {
            await updateUnitConversion({
                variables: {
                    id: current._id,
                    record: { rules: ruleIds.filter((id) => id !== rule._id) },
                },
            });
            await removeConversionRule({ variables: { id: rule._id } });
        } catch (err) {
            showError(err);
        }
    };

    const handleDelete = async () => {
        if (!current) return;
        try {
            await removeUnitConversion({ variables: { id: current._id } });
            await Promise.all(ruleIds.map((id) => removeConversionRule({ variables: { id } })));
            setCurrentId(null);
            successToast({ title: 'Unit conversion deleted', position: 'top' });
        } catch (err) {
            showError(err);
        }
    };

    return (
        <VStack>
            <Box maxW='32em' mx='auto' mt={32} borderWidth='1px' borderRadius='lg' p={8}>
                <Heading pb={6}>Edit Unit Conversion</Heading>
                <VStack spacing={8} alignItems='stretch'>
                    <SearchableSelect
                        label='Select unit conversion'
                        aria-label='Select unit conversion'
                        options={(data?.unitConversionMany ?? []).map((conversion) => ({
                            value: conversion._id,
                            label: conversion.baseUnit.longSingular,
                        }))}
                        value={currentId}
                        onChange={setCurrentId}
                    />
                    <CreateConversionRuleForm
                        units={unitData?.unitMany ?? []}
                        baseUnit={current?.baseUnit}
                        onCreate={handleAddRule}
                    />
                    <ConversionRuleList
                        rules={current?.rules ?? []}
                        baseUnit={current?.baseUnit}
                        onRemove={handleRemoveRule}
                    />
                    <ButtonGroup display='flex' justifyContent='flex-end' isDisabled={!current}>
                        <Button
                            colorScheme='red'
                            isLoading={deleting}
                            onClick={handleDelete}
                            aria-label='Delete unit conversion'
                        >
                            Delete
                        </Button>
                    </ButtonGroup>
                </VStack>
            </Box>
        </VStack>
    );
}
