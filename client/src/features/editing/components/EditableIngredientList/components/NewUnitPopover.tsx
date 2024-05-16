import { useEffect, useState } from 'react';
import { ApolloError, useMutation } from '@apollo/client';
import { ValidationError, boolean, mixed, object, string } from 'yup';
import { PopoverArrow, PopoverHeader, Radio, RadioGroup, Stack } from '@chakra-ui/react';
import { Checkbox, PopoverCloseButton, PopoverContent, useToast } from '@chakra-ui/react';
import { Button, ButtonGroup, FormControl, FormHelperText, HStack } from '@chakra-ui/react';

import { CREATE_UNIT } from '@recipe/graphql/mutations/unit';
import { EnumUnitCreatePreferredNumberFormat } from '@recipe/graphql/generated';

import { UnitSuggestion } from './UnitDropdown';
import { FloatingLabelInput } from '../../../../../components/FloatingLabelInput';

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
function NewUnitForm(props: NewUnitFormProps) {
    const { firstFieldRef, onClose, handleSelect } = props;
    const [hasError, setHasError] = useState(false);
    const toast = useToast();
    const [shortSingular, setShortSingular] = useState('');
    const [shortPlural, setShortPlural] = useState('');
    const [longSingular, setLongSingular] = useState('');
    const [longPlural, setLongPlural] = useState('');
    const [preferredNumberFormat, setpreferredNumberFormat] = useState('');
    const [hasSpace, setHasSpace] = useState(true);
    const [isFocused, setIsFocused] = useState(false);

    const [createNewUnit] = useMutation(CREATE_UNIT, {
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
        preferredNumberFormat: mixed<EnumUnitCreatePreferredNumberFormat>()
            .required()
            .oneOf(
                [
                    EnumUnitCreatePreferredNumberFormat.Decimal,
                    EnumUnitCreatePreferredNumberFormat.Fraction,
                ],
                'You must select a number format'
            ),
        hasSpace: boolean().required(),
    });

    const handleSubmit = () => {
        try {
            const validated = formSchema.validateSync({
                shortSingular,
                shortPlural: shortPlural === '' ? shortSingular : shortPlural,
                longSingular,
                longPlural: longPlural === '' ? longSingular : longPlural,
                preferredNumberFormat,
                hasSpace,
            });
            createNewUnit({ variables: { record: validated } });
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
    };

    useEffect(() => {
        const handleKeyboardEvent = (e: KeyboardEvent) => {
            if (isFocused && e.key === 'Enter') {
                e.preventDefault();
                handleSubmit();
            }
        };

        window.addEventListener('keydown', handleKeyboardEvent);

        return () => {
            window.removeEventListener('keydown', handleKeyboardEvent);
        };
    });

    return (
        <Stack
            spacing={4}
            paddingTop={3}
            paddingLeft={2}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
        >
            <FloatingLabelInput
                firstFieldRef={firstFieldRef}
                id='short-singular-name'
                label='Short singular name'
                value={shortSingular}
                isInvalid={hasError}
                isRequired
                onChange={(e) => {
                    setShortSingular(e.target.value.toLowerCase());
                    hasError && setHasError(false);
                }}
            />
            <FloatingLabelInput
                label='Short plural name'
                id='short-plural-name'
                value={shortPlural}
                isInvalid={hasError}
                onChange={(e) => {
                    setShortPlural(e.target.value.toLowerCase());
                    hasError && setHasError(false);
                }}
            />
            <FloatingLabelInput
                label='Long singular name'
                id='long-singular-name'
                value={longSingular}
                isRequired
                isInvalid={hasError}
                onChange={(e) => {
                    setLongSingular(e.target.value.toLowerCase());
                    hasError && setHasError(false);
                }}
            />
            <FloatingLabelInput
                label='Long plural name'
                id='long-plural-name'
                value={longPlural}
                isInvalid={hasError}
                onChange={(e) => {
                    setLongPlural(e.target.value.toLowerCase());
                    hasError && setHasError(false);
                }}
            />
            <FormControl>
                <FormHelperText>Preferred number format</FormHelperText>
                <RadioGroup onChange={setpreferredNumberFormat}>
                    <HStack spacing={'12px'}>
                        <Radio value='decimal'>decimal</Radio>
                        <Radio value='fraction'>fraction</Radio>
                    </HStack>
                </RadioGroup>
            </FormControl>
            <Checkbox onChange={(e) => setHasSpace(e.target.checked)} isChecked={hasSpace}>
                Space after quantity
            </Checkbox>
            <ButtonGroup display='flex' justifyContent='flex-left' paddingTop={2}>
                <Button colorScheme='teal' onClick={handleSubmit}>
                    Save
                </Button>
            </ButtonGroup>
        </Stack>
    );
}

export function NewUnitPopover(props: NewUnitFormProps) {
    return (
        <PopoverContent paddingRight={4} paddingBottom={3} paddingLeft={2}>
            <PopoverArrow />
            <PopoverCloseButton />
            <PopoverHeader border='hidden'>Add new unit</PopoverHeader>
            <NewUnitForm {...props} />
        </PopoverContent>
    );
}
