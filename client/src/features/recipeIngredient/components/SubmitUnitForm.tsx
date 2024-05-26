import { useEffect, useState } from 'react';
import { ApolloError, useMutation } from '@apollo/client';
import { ValidationError, boolean, mixed, object, string } from 'yup';
import { Checkbox, Radio, RadioGroup, SpaceProps, Stack, useToast } from '@chakra-ui/react';
import { Button, ButtonGroup, FormControl, FormHelperText, HStack } from '@chakra-ui/react';

import { FloatingLabelInput } from '@recipe/common/components';
import { CREATE_UNIT, MODIFY_UNIT } from '@recipe/graphql/mutations/unit';
import { CreateUnitMutation, ModifyUnitMutation, Scalars } from '@recipe/graphql/generated';
import { EnumUnitCreatePreferredNumberFormat, Unit } from '@recipe/graphql/generated';

function formatError(error: ApolloError) {
    if (error.message.startsWith('E11000')) {
        return 'Unit already exists';
    }
    return error.message;
}

interface CommonSubmitUnitFormProps {
    firstFieldRef?: React.MutableRefObject<HTMLInputElement | null>;
    initialData?: Unit;
    isDisabled?: boolean;
    paddingLeft?: SpaceProps['paddingLeft'];
}
interface CreateSubmitUnitFormProps extends CommonSubmitUnitFormProps {
    mutation: typeof CREATE_UNIT;
    mutationVariables?: never;
    handleComplete: (data: CreateUnitMutation) => void;
}
interface ModifySubmitUnitFormProps extends CommonSubmitUnitFormProps {
    mutation: typeof MODIFY_UNIT;
    mutationVariables?: { id: Scalars['MongoID']['input'] };
    handleComplete: (data: ModifyUnitMutation) => void;
}
type SubmitUnitFormProps = CreateSubmitUnitFormProps | ModifySubmitUnitFormProps;
export function SubmitUnitForm(props: SubmitUnitFormProps) {
    const {
        firstFieldRef,
        mutation,
        mutationVariables,
        handleComplete,
        initialData,
        isDisabled,
        paddingLeft = 2,
    } = props;
    const toast = useToast();
    const [hasError, setHasError] = useState(false);
    const [shortSingular, setShortSingular] = useState('');
    const [shortPlural, setShortPlural] = useState('');
    const [longSingular, setLongSingular] = useState('');
    const [longPlural, setLongPlural] = useState('');
    const [preferredNumberFormat, setpreferredNumberFormat] = useState('');
    const [hasSpace, setHasSpace] = useState(true);
    const [isFocused, setIsFocused] = useState(false);

    const [saveUnit] = useMutation(mutation, {
        onCompleted: handleComplete,
        onError: (error) => {
            toast({
                title: 'Error saving unit',
                description: formatError(error),
                status: 'error',
                position: 'top',
                duration: 3000,
            });
            setHasError(true);
        },
        refetchQueries: ['GetUnits'],
    });

    useEffect(() => {
        if (initialData) {
            setShortSingular(initialData.shortSingular);
            setShortPlural(initialData.shortPlural);
            setLongSingular(initialData.longSingular);
            setLongPlural(initialData.longPlural);
            setpreferredNumberFormat(initialData.preferredNumberFormat);
            setHasSpace(initialData.hasSpace);
        }
        if (isDisabled) {
            setHasError(false);
            // Clear form fields when disabled
            setShortSingular('');
            setShortPlural('');
            setLongSingular('');
            setLongPlural('');
            setpreferredNumberFormat('');
            setHasSpace(false);
        }
    }, [initialData, isDisabled]);

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
            saveUnit({ variables: { record: validated, ...mutationVariables } });
        } catch (e: unknown) {
            setHasError(true);
            if (e instanceof ValidationError) {
                toast({
                    title: 'Error saving unit',
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
            paddingLeft={paddingLeft}
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
                isDisabled={isDisabled}
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
                isDisabled={isDisabled}
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
                isDisabled={isDisabled}
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
                isDisabled={isDisabled}
                isInvalid={hasError}
                onChange={(e) => {
                    setLongPlural(e.target.value.toLowerCase());
                    hasError && setHasError(false);
                }}
            />
            <FormControl isDisabled={isDisabled}>
                <FormHelperText>Preferred number format</FormHelperText>
                <RadioGroup onChange={setpreferredNumberFormat} value={preferredNumberFormat}>
                    <HStack spacing='12px'>
                        <Radio value='decimal'>decimal</Radio>
                        <Radio value='fraction'>fraction</Radio>
                    </HStack>
                </RadioGroup>
            </FormControl>
            <Checkbox
                isDisabled={isDisabled}
                onChange={(e) => setHasSpace(e.target.checked)}
                isChecked={hasSpace}
            >
                Space after quantity
            </Checkbox>
            <ButtonGroup
                display='flex'
                justifyContent='flex-left'
                paddingTop={2}
                isDisabled={isDisabled}
            >
                <Button colorScheme='teal' onClick={handleSubmit}>
                    Save
                </Button>
            </ButtonGroup>
        </Stack>
    );
}
