import {
    Button,
    ButtonGroup,
    FormControl,
    FormHelperText,
    FormLabel,
    HStack,
} from '@chakra-ui/react';
import { Radio, RadioGroup, Stack, Input } from '@chakra-ui/react';
import { TextInput } from '../../../../../components/TextInput';
import { gql } from '../../../../../__generated__';
import { useState } from 'react';
import { ApolloError, useMutation } from '@apollo/client';
import { useToast } from '@chakra-ui/react';
import { object, string, ValidationError } from 'yup';
import { EnumUnitPreferredNumberFormat } from '../../../../../__generated__/graphql';
import { PopoverHeader, PopoverArrow } from '@chakra-ui/react';
import { PopoverCloseButton, PopoverContent } from '@chakra-ui/react';
import { UnitSuggestion } from './UnitDropdownList';
import { theme } from '../../../../../components/FloatingLabels';

const CREATE_NEW_UNIT_MUTATION = gql(`
    mutation CreateUnit($record: CreateOneUnitInput!) {
        unitCreateOne(record: $record) {
            record {
                _id
                longSingular
                longPlural
                shortSingular
                shortPlural
                preferredNumberFormat
            }
        }
    }
`);

function formatError(error: ApolloError) {
    if (error.message.startsWith('E11000')) {
        return 'Unit already exists';
    }
    return error.message;
}

interface NewUnitFormProps {
    firstFieldRef: React.MutableRefObject<HTMLInputElement | null>;
    onClose: () => void;
    handleSelect: (item: UnitSuggestion) => void;
}
function NewUnitForm({ firstFieldRef, onClose, handleSelect }: NewUnitFormProps) {
    const [hasError, setHasError] = useState(false);
    const toast = useToast();
    const [shortSingular, setShortSingular] = useState('');
    const [shortPlural, setShortPlural] = useState('');
    const [longSingular, setLongSingular] = useState('');
    const [longPlural, setLongPlural] = useState('');
    const [preferredNumberFormat, setpreferredNumberFormat] = useState('');

    const [createNewUnit] = useMutation(CREATE_NEW_UNIT_MUTATION, {
        onCompleted: (data) => {
            onClose();
            handleSelect({
                value: data!.unitCreateOne!.record!,
                colour: undefined,
            });
            toast({
                title: 'Unit created',
                description: `${data?.unitCreateOne?.record?.longSingular} created`,
                status: 'success',
                position: 'top',
                duration: 3000,
            });
        },
        onError: (error) => {
            toast({
                title: 'Error creating new unit',
                description: formatError(error),
                status: 'error',
                position: 'top',
                duration: 3000,
            });
            setHasError(true);
        },
        refetchQueries: ['GetUnits'],
    });

    const formSchema = object({
        shortSingular: string().required('Short singular name is required'),
        shortPlural: string().required('Short plural name is required'),
        longSingular: string().required('Long singular name is required'),
        longPlural: string().required('Long plural name is required'),
        preferredNumberFormat: string()
            .required()
            .oneOf(['decimal', 'fraction'], 'You must select a number format'),
    });

    return (
        <FormControl isInvalid={hasError}>
            <Stack spacing={1} paddingTop={3} paddingLeft={2}>
                <FormControl variant='floating'>
                    <Input placeholder='' />
                    <FormLabel htmlFor='short-singular-name'>Short singular name</FormLabel>
                </FormControl>

                {/* <TextInput
                    placeholder='Short singular name'
                    id='short-singular-name'
                    ref={firstFieldRef}
                    value={shortSingular}
                    onChange={(e) => {
                        setShortSingular(e.target.value.toLowerCase());
                        hasError && setHasError(false);
                    }}
                /> */}
                <TextInput
                    placeholder='Short plural name'
                    id='short-plural-name'
                    value={shortPlural}
                    onChange={(e) => {
                        setShortPlural(e.target.value.toLowerCase());
                        hasError && setHasError(false);
                    }}
                />
                <TextInput
                    placeholder='Long singular name'
                    id='long-singular-name'
                    value={longSingular}
                    onChange={(e) => {
                        setLongSingular(e.target.value.toLowerCase());
                        hasError && setHasError(false);
                    }}
                />
                <TextInput
                    placeholder='Long plural name'
                    id='long-plural-name'
                    value={longPlural}
                    onChange={(e) => {
                        setLongPlural(e.target.value.toLowerCase());
                        hasError && setHasError(false);
                    }}
                />
                <FormHelperText>Preferred number format</FormHelperText>
                <RadioGroup onChange={setpreferredNumberFormat}>
                    <HStack spacing={'12px'}>
                        <Radio value='decimal'>decimal</Radio>
                        <Radio value='fraction'>fraction</Radio>
                    </HStack>
                </RadioGroup>
                <ButtonGroup display='flex' justifyContent='flex-left' paddingTop={2}>
                    <Button
                        colorScheme='teal'
                        onClick={() => {
                            try {
                                const parsedForm = formSchema.validateSync({
                                    shortSingular,
                                    shortPlural,
                                    longSingular,
                                    longPlural,
                                    preferredNumberFormat,
                                });
                                createNewUnit({
                                    variables: {
                                        record: {
                                            ...parsedForm,
                                            preferredNumberFormat:
                                                parsedForm.preferredNumberFormat as EnumUnitPreferredNumberFormat,
                                        },
                                    },
                                });
                            } catch (e: unknown) {
                                setHasError(true);
                                if (e instanceof ValidationError) {
                                    toast({
                                        title: 'Error creating new unit',
                                        description: e.message,
                                        status: 'error',
                                        position: 'top',
                                        duration: 3000,
                                    });
                                }
                            }
                        }}
                    >
                        Save
                    </Button>
                </ButtonGroup>
            </Stack>
        </FormControl>
    );
}

export function NewUnitPopover(props: NewUnitFormProps) {
    return (
        <PopoverContent paddingRight={4} paddingBottom={3} paddingLeft={2}>
            <PopoverArrow />
            <PopoverCloseButton />
            <PopoverHeader border={'hidden'}>Add new unit</PopoverHeader>
            <NewUnitForm {...props} />
        </PopoverContent>
    );
}
