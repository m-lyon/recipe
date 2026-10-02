import { useState } from 'react';
import { array, object, string } from 'yup';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@apollo/client';
import { Box, Button, FormControl, HStack, Heading, VStack } from '@chakra-ui/react';

import { DELAY_SHORT, PATH } from '@recipe/constants';
import { GET_UNITS } from '@recipe/graphql/queries/unit';
import { SearchableSelect } from '@recipe/common/components';
import { CreateConversionRuleForm } from '@recipe/features/forms';
import { useErrorToast, useSuccessToast } from '@recipe/common/hooks';
import { ConversionRule, ConversionRuleList } from '@recipe/features/forms';
import { CREATE_UNIT_CONVERSION } from '@recipe/graphql/mutations/unitConversion';
import { REMOVE_CONVERSION_RULE } from '@recipe/graphql/mutations/unitConversion';

export function CreateUnitConversion() {
    const [baseUnit, setBaseUnit] = useState<ModifyableUnit | undefined>(undefined);
    const [rules, setRules] = useState<ConversionRule[]>([]);
    const { data, loading: loadingUnits } = useQuery(GET_UNITS);
    const [removeConversionRule] = useMutation(REMOVE_CONVERSION_RULE);
    const [createUnitConversion, { loading }] = useMutation(CREATE_UNIT_CONVERSION);
    const navigate = useNavigate();
    const errorToast = useErrorToast();
    const successToast = useSuccessToast();

    const formSchema = object({
        baseUnit: string().required(),
        rules: array(string().required()).min(1).required(),
    });

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            const validated = await formSchema.validate({
                baseUnit: baseUnit?._id,
                rules: rules.map((r) => r._id),
            });
            await createUnitConversion({ variables: { record: { ...validated } } });
            successToast({
                title: 'Unit conversion created',
                description:
                    'The unit conversion has been created, redirecting you to the home page',
                position: 'top',
            });
            setTimeout(() => navigate(PATH.ROOT), DELAY_SHORT);
        } catch (err) {
            if (err instanceof Error) {
                console.error(err);
                errorToast({ title: 'An error occurred.', description: err.message });
            }
        }
    };

    const handleRemoveRule = (rule: ConversionRule) => {
        removeConversionRule({ variables: { id: rule._id } })
            .then(() => {
                setRules((rules) => rules.filter((r) => r._id !== rule._id));
            })
            .catch((err) => {
                if (err instanceof Error) {
                    console.error(err);
                    errorToast({ title: 'An error occurred.', description: err.message });
                }
            });
    };

    return (
        <VStack>
            <Box maxW='32em' mx='auto' mt={32} borderWidth='1px' borderRadius='lg' p={8}>
                <Heading pb={6}>Create Unit Conversion</Heading>
                <CreateConversionRuleForm
                    onCreate={(rule) => setRules((rules) => [...rules, rule])}
                    units={loadingUnits ? [] : data!.unitMany}
                    baseUnit={baseUnit}
                />
                <form onSubmit={handleSubmit}>
                    <HStack mt={8} alignItems='flex-start'>
                        <FormControl>
                            <SearchableSelect
                                label='Base unit'
                                aria-label='Base unit'
                                options={(data?.unitMany ?? []).map((unit) => ({
                                    value: unit._id,
                                    label: unit.longSingular,
                                }))}
                                value={baseUnit?._id ?? null}
                                onChange={(id) => {
                                    setBaseUnit(data?.unitMany.find((unit) => unit._id === id));
                                }}
                            />
                        </FormControl>
                        <FormControl>
                            <ConversionRuleList
                                rules={rules}
                                baseUnit={baseUnit}
                                onRemove={handleRemoveRule}
                            />
                        </FormControl>
                    </HStack>
                    <Button mt={8} colorScheme='teal' isLoading={loading} type='submit'>
                        Create Unit Conversion
                    </Button>
                </form>
            </Box>
        </VStack>
    );
}
