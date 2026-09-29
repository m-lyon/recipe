import { FormEvent, useState } from 'react';
import { number, object, string } from 'yup';
import { useMutation } from '@apollo/client';
import { Box, Button, FormControl, FormLabel, HStack, Input } from '@chakra-ui/react';

import { useErrorToast } from '@recipe/common/hooks';
import { SearchableSelect } from '@recipe/common/components';
import { CREATE_CONVERSION_RULE } from '@recipe/graphql/mutations/unitConversion';

export type ConversionRule = NonNullable<CompletedCreateConversionRule['record']>;

interface Props {
    units: ModifyableUnit[];
    baseUnit: ModifyableUnit | undefined;
    onCreate: (rule: ConversionRule) => void | Promise<void>;
}
export function CreateConversionRuleForm(props: Props) {
    const { units, baseUnit, onCreate } = props;
    const [baseUnitThreshold, setThreshold] = useState(0);
    const [unit, setUnit] = useState<ModifyableUnit | undefined>(undefined);
    const [baseToUnitConversion, setbaseToUnitConversion] = useState(0);
    const [createConversionRule, { loading }] = useMutation(CREATE_CONVERSION_RULE);
    const toast = useErrorToast();

    const formSchema = object({
        baseUnitThreshold: number().required(),
        unit: string().required(),
        baseUnit: string().required(),
        baseToUnitConversion: number().required(),
    });

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            const validated = await formSchema.validate({
                baseUnitThreshold,
                unit: unit?._id,
                baseUnit: baseUnit?._id,
                baseToUnitConversion,
            });
            const { data } = await createConversionRule({
                variables: { record: { ...validated } },
            });
            if (data?.conversionRuleCreateOne?.record) {
                await onCreate(data.conversionRuleCreateOne.record);
                // Clear the form so several rules can be added in a row
                setUnit(undefined);
                setThreshold(0);
                setbaseToUnitConversion(0);
            }
        } catch (err) {
            if (err instanceof Error) {
                toast({ title: 'An error occurred.', description: err.message });
            }
        }
    };

    return (
        <Box borderWidth='1px' borderRadius='lg' p={4}>
            <form onSubmit={handleSubmit}>
                <HStack height='4em' alignItems='flex-end'>
                    <FormControl isDisabled={!baseUnit}>
                        <FormLabel>Unit</FormLabel>
                        <SearchableSelect
                            aria-label='Unit'
                            options={units
                                .filter((unit) => unit._id !== baseUnit?._id)
                                .map((unit) => ({ value: unit._id, label: unit.shortSingular }))}
                            value={unit?._id ?? null}
                            onChange={(id) => setUnit(units.find((unit) => unit._id === id))}
                            disabled={!baseUnit}
                        />
                    </FormControl>
                    <FormControl isDisabled={!baseUnit}>
                        <FormLabel>Threshold</FormLabel>
                        <Input
                            placeholder='Threshold'
                            value={baseUnitThreshold}
                            onChange={(e) => setThreshold(Number(e.target.value))}
                        />
                    </FormControl>
                    <FormControl isDisabled={!baseUnit}>
                        <FormLabel>Conversion</FormLabel>
                        <Input
                            placeholder='Base Conversion'
                            value={baseToUnitConversion}
                            onChange={(e) => setbaseToUnitConversion(Number(e.target.value))}
                        />
                    </FormControl>
                    <Button
                        colorScheme='teal'
                        isLoading={loading}
                        type='submit'
                        minW='6em'
                        isDisabled={!baseUnit}
                    >
                        Add Rule
                    </Button>
                </HStack>
            </form>
        </Box>
    );
}
