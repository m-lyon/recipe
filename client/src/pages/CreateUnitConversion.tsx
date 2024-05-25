import { useNavigate } from 'react-router-dom';
import { array, number, object, string } from 'yup';
import { useMutation, useQuery } from '@apollo/client';
import { FormLabel, Input, ListItem, Select } from '@chakra-ui/react';
import { Dispatch, FormEvent, SetStateAction, useState } from 'react';
import { List, Tag, TagCloseButton, TagLabel } from '@chakra-ui/react';
import { Box, Button, FormControl, HStack, Heading, VStack, useToast } from '@chakra-ui/react';

import { GET_UNITS } from '@recipe/graphql/queries/unit';
import { CREATE_CONVERSION_RULE } from '@recipe/graphql/mutations/unitConversion';
import { CREATE_UNIT_CONVERSION } from '@recipe/graphql/mutations/unitConversion';
import { REMOVE_CONVERSION_RULE } from '@recipe/graphql/mutations/unitConversion';
import { CreateConversionRuleMutation, GetUnitsQuery, Unit } from '@recipe/graphql/generated';

import { ROOT_PATH } from '../constants';

type ConversionRule = NonNullable<
    NonNullable<CreateConversionRuleMutation['conversionRuleCreateOne']>['record']
>;
interface CreateConversionRuleProps {
    setConversionRules: Dispatch<SetStateAction<ConversionRule[]>>;
    unitData: GetUnitsQuery | undefined;
    baseUnit: Unit | undefined;
}
function CreateConversionRule(props: CreateConversionRuleProps) {
    const { setConversionRules, unitData, baseUnit } = props;
    const [baseUnitThreshold, setThreshold] = useState(0);
    const [unit, setUnit] = useState<Unit | undefined>(undefined);
    const [baseToUnitConversion, setbaseToUnitConversion] = useState(0);
    const [createConversionRule, { loading }] = useMutation(CREATE_CONVERSION_RULE);
    const toast = useToast();

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
                toast({
                    title: 'An error occurred.',
                    description: err.message,
                    status: 'error',
                    duration: 3000,
                    isClosable: true,
                });
            }
        }
    };

    return (
        <Box borderWidth='1px' borderRadius='lg' p={4}>
            <form onSubmit={handleSubmit}>
                <HStack height='4em' alignItems='flex-end'>
                    <FormControl isDisabled={!baseUnit}>
                        <FormLabel>Unit</FormLabel>
                        <Select
                            placeholder='-'
                            value={unit?._id}
                            onChange={(e) => {
                                setUnit(
                                    unitData?.unitMany.find((unit) => unit._id === e.target.value)
                                );
                            }}
                        >
                            {unitData?.unitMany.map((unit) => (
                                <option key={unit._id} value={unit._id}>
                                    {unit.shortSingular}
                                </option>
                            ))}
                        </Select>
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

export function CreateUnitConversion() {
    const [baseUnit, setBaseUnit] = useState<Unit | undefined>(undefined);
    const [rules, setRules] = useState<ConversionRule[]>([]);
    const { data } = useQuery(GET_UNITS);
    const [removeConversionRule] = useMutation(REMOVE_CONVERSION_RULE);
    const [createUnitConversion, { loading }] = useMutation(CREATE_UNIT_CONVERSION);
    const navigate = useNavigate();
    const toast = useToast();

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
            toast({
                title: 'Unit conversion created',
                description:
                    'The unit conversion has been created, redirecting you to the home page',
                status: 'success',
                position: 'top',
                duration: 1500,
            });
            setTimeout(() => navigate(ROOT_PATH), 1500);
        } catch (err) {
            if (err instanceof Error) {
                console.error(err);
                toast({
                    title: 'An error occurred.',
                    description: err.message,
                    status: 'error',
                    duration: 9000,
                    isClosable: true,
                });
            }
        }
    };

    const ruleList = rules.map((rule) => (
        <ListItem key={rule._id}>
            <Tag maxW='100%' whiteSpace='nowrap' overflow='hidden' textOverflow='ellipsis' mb={2}>
                <TagLabel>
                    {rule.baseToUnitConversion} {baseUnit?.shortSingular} = 1{' '}
                    {rule.unit!.shortSingular}, {baseUnit?.shortSingular} &gt;={' '}
                    {rule.baseUnitThreshold}
                </TagLabel>
                <TagCloseButton
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
                                    toast({
                                        title: 'An error occurred.',
                                        description: err.message,
                                        status: 'error',
                                        duration: 9000,
                                        isClosable: true,
                                    });
                                }
                            });
                    }}
                />
            </Tag>
        </ListItem>
    ));

    return (
        <VStack>
            <Box maxW='32em' mx='auto' mt={32} borderWidth='1px' borderRadius='lg' p={8}>
                <Heading pb={6}>Create Unit Conversion</Heading>
                <CreateConversionRule
                    setConversionRules={setRules}
                    unitData={data}
                    baseUnit={baseUnit}
                />
                <form onSubmit={handleSubmit}>
                    <HStack mt={8}>
                        <FormControl>
                            <FormLabel>Base Unit</FormLabel>
                            <Select
                                placeholder='-'
                                value={baseUnit?._id}
                                onChange={(e) => {
                                    setBaseUnit(
                                        data?.unitMany.find((unit) => unit._id === e.target.value)
                                    );
                                }}
                            >
                                {data?.unitMany.map((unit) => (
                                    <option key={unit._id} value={unit._id}>
                                        {unit.shortSingular}
                                    </option>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl>
                            <List>{ruleList}</List>
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
