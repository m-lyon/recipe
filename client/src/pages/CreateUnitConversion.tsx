import { Tag } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { array, number, object, string } from 'yup';
import { useMutation, useQuery } from '@apollo/client';
import { Input, List, Select } from '@chakra-ui/react';
import { createListCollection } from '@chakra-ui/react';
import { Dispatch, FormEvent, SetStateAction, useState } from 'react';
import { Box, Button, Field, HStack, Heading, VStack } from '@chakra-ui/react';

import { DELAY_SHORT, PATH } from '@recipe/constants';
import { GET_UNITS } from '@recipe/graphql/queries/unit';
import { useErrorToast, useSuccessToast } from '@recipe/common/hooks';
import { CREATE_CONVERSION_RULE } from '@recipe/graphql/mutations/unitConversion';
import { CREATE_UNIT_CONVERSION } from '@recipe/graphql/mutations/unitConversion';
import { REMOVE_CONVERSION_RULE } from '@recipe/graphql/mutations/unitConversion';

type ConversionRule = NonNullable<CompletedCreateConversionRule['record']>;
interface CreateConversionRuleProps {
    setConversionRules: Dispatch<SetStateAction<ConversionRule[]>>;
    units: ModifyableUnit[];
    baseUnit: ModifyableUnit | undefined;
}
function CreateConversionRule(props: CreateConversionRuleProps) {
    const { setConversionRules, units, baseUnit } = props;
    const [baseUnitThreshold, setThreshold] = useState(0);
    const [unit, setUnit] = useState<ModifyableUnit | undefined>(undefined);
    const [baseToUnitConversion, setbaseToUnitConversion] = useState(0);
    const [createConversionRule, { loading }] = useMutation(CREATE_CONVERSION_RULE);
    const toast = useErrorToast();
    const unitsCollection = createListCollection({ items: units });

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
                const record = data.conversionRuleCreateOne.record;
                setConversionRules((rules) => [...rules, record]);
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
                    <Field.Root disabled={!baseUnit}>
                        <Field.Label>Unit</Field.Label>
                        <Select.Root
                            collection={unitsCollection}
                            value={unit?._id}
                            onValueChange={(e) => {
                                setUnit(units.find((unit) => unit._id === e.value));
                            }}
                        >
                            <Select.HiddenSelect />
                            <Select.Control>
                                <Select.Trigger>
                                    <Select.ValueText placeholder='-' />
                                </Select.Trigger>
                                <Select.IndicatorGroup>
                                    <Select.Indicator />
                                </Select.IndicatorGroup>
                            </Select.Control>
                            <Select.Positioner>
                                <Select.Content>
                                    {unitsCollection.items.map((unit) => (
                                        <Select.Item key={unit._id} item={unit._id}>
                                            {unit.shortSingular}
                                            <Select.ItemIndicator />
                                        </Select.Item>
                                    ))}
                                </Select.Content>
                            </Select.Positioner>
                        </Select.Root>
                    </Field.Root>
                    <Field.Root disabled={!baseUnit}>
                        <Field.Label>Threshold</Field.Label>
                        <Input
                            placeholder='Threshold'
                            value={baseUnitThreshold}
                            onChange={(e) => setThreshold(Number(e.target.value))}
                        />
                    </Field.Root>
                    <Field.Root disabled={!baseUnit}>
                        <Field.Label>Conversion</Field.Label>
                        <Input
                            placeholder='Base Conversion'
                            value={baseToUnitConversion}
                            onChange={(e) => setbaseToUnitConversion(Number(e.target.value))}
                        />
                    </Field.Root>
                    <Button
                        colorPalette='teal'
                        loading={loading}
                        type='submit'
                        minW='6em'
                        disabled={!baseUnit}
                    >
                        Add Rule
                    </Button>
                </HStack>
            </form>
        </Box>
    );
}

export function CreateUnitConversion() {
    const [baseUnit, setBaseUnit] = useState<ModifyableUnit | undefined>(undefined);
    const [rules, setRules] = useState<ConversionRule[]>([]);
    const { data, loading: loadingUnits } = useQuery(GET_UNITS);
    const [removeConversionRule] = useMutation(REMOVE_CONVERSION_RULE);
    const [createUnitConversion, { loading }] = useMutation(CREATE_UNIT_CONVERSION);
    const navigate = useNavigate();
    const errorToast = useErrorToast();
    const successToast = useSuccessToast();
    const baseUnitCollection = createListCollection({
        items: data?.unitMany || [],
    });
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

    const ruleList = rules.map((rule) => (
        <List.Item key={rule._id}>
            <Tag.Root
                maxW='100%'
                whiteSpace='nowrap'
                overflow='hidden'
                textOverflow='ellipsis'
                mb={2}
            >
                <Tag.Label>
                    {rule.baseToUnitConversion} {baseUnit?.shortSingular} = 1{' '}
                    {rule.unit!.shortSingular}, {baseUnit?.shortSingular} &gt;={' '}
                    {rule.baseUnitThreshold}
                </Tag.Label>
                <Tag.EndElement>
                    <Tag.CloseTrigger
                        onClick={(e) => {
                            e.preventDefault();
                            removeConversionRule({
                                variables: { id: rule._id },
                            })
                                .then(() => {
                                    setRules((rules) => rules.filter((r) => r._id !== rule._id));
                                })
                                .catch((err) => {
                                    if (err instanceof Error) {
                                        console.error(err);
                                        errorToast({
                                            title: 'An error occurred.',
                                            description: err.message,
                                        });
                                    }
                                });
                        }}
                    />
                </Tag.EndElement>
            </Tag.Root>
        </List.Item>
    ));

    return (
        <VStack>
            <Box maxW='32em' mx='auto' mt={32} borderWidth='1px' borderRadius='lg' p={8}>
                <Heading pb={6}>Create Unit Conversion</Heading>
                <CreateConversionRule
                    setConversionRules={setRules}
                    units={loadingUnits ? [] : data!.unitMany}
                    baseUnit={baseUnit}
                />
                <form onSubmit={handleSubmit}>
                    <HStack mt={8}>
                        <Field.Root>
                            <Field.Label>Base Unit</Field.Label>
                            <Select.Root
                                collection={baseUnitCollection}
                                value={baseUnit?._id}
                                onValueChange={(e) => {
                                    setBaseUnit(
                                        data?.unitMany.find((unit) => unit._id === e.value)
                                    );
                                }}
                            >
                                <Select.HiddenSelect />
                                <Select.Control>
                                    <Select.Trigger>
                                        <Select.ValueText placeholder='-' />
                                    </Select.Trigger>
                                    <Select.IndicatorGroup>
                                        <Select.Indicator />
                                    </Select.IndicatorGroup>
                                </Select.Control>
                                <Select.Positioner>
                                    <Select.Content>
                                        {baseUnitCollection.items.map((unit) => (
                                            <Select.Item key={unit._id} item={unit._id}>
                                                {unit.shortSingular}
                                                <Select.ItemIndicator />
                                            </Select.Item>
                                        ))}
                                    </Select.Content>
                                </Select.Positioner>
                            </Select.Root>
                        </Field.Root>
                        <Field.Root>
                            <List.Root>{ruleList}</List.Root>
                        </Field.Root>
                    </HStack>
                    <Button mt={8} colorPalette='teal' loading={loading} type='submit'>
                        Create Unit Conversion
                    </Button>
                </form>
            </Box>
        </VStack>
    );
}
