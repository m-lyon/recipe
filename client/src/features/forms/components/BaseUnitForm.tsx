import { ApolloError } from '@apollo/client';
import { StackProps } from '@chakra-ui/react';
import { Button, ButtonGroup, Checkbox } from '@chakra-ui/react';
import { ValidationError, boolean, mixed, object, string } from 'yup';
import { MutableRefObject, useCallback, useEffect, useState } from 'react';
import { FormControl, FormHelperText, HStack, Radio, RadioGroup, Stack } from '@chakra-ui/react';

import { useErrorToast } from '@recipe/common/hooks';
import { FloatingLabelInput } from '@recipe/common/components';

export function formatUnitError(error: ApolloError) {
    if (error.message.startsWith('E11000')) {
        return 'Unit already exists';
    }
    return error.message;
}

export type UnitFormData = ReturnType<typeof unitFormSchema.validateSync>;
export interface BaseUnitFormProps extends StackProps {
    fieldRef?: MutableRefObject<HTMLInputElement | null>;
    initData?: ModifyableUnit;
    disabled?: boolean;
    handleSubmit: (data: UnitFormData) => void;
    handleDelete?: () => void;
}
const numberFormat: NumberFormat[] = ['decimal', 'fraction'];
export const unitFormSchema = object({
    shortSingular: string().required('Short singular name is required'),
    shortPlural: string().required('Short plural name is required'),
    longSingular: string().required('Long singular name is required'),
    longPlural: string().required('Long plural name is required'),
    preferredNumberFormat: mixed<NumberFormat>()
        .required()
        .oneOf(Object.values(numberFormat), 'You must select a number format'),
    hasSpace: boolean().required(),
    unique: boolean().required(),
});

export function BaseUnitForm(props: BaseUnitFormProps) {
    const { fieldRef, initData, disabled, handleSubmit, handleDelete, ...rest } = props;
    const toast = useErrorToast();
    const [hasError, setHasError] = useState(false);
    const [shortSingular, setShortSingular] = useState('');
    const [shortPlural, setShortPlural] = useState('');
    const [longSingular, setLongSingular] = useState('');
    const [longPlural, setLongPlural] = useState('');
    const [preferredNumberFormat, setpreferredNumberFormat] = useState('');
    const [hasSpace, setHasSpace] = useState(true);
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
        if (initData) {
            setShortSingular(initData.shortSingular);
            setShortPlural(initData.shortPlural);
            setLongSingular(initData.longSingular);
            setLongPlural(initData.longPlural);
            setpreferredNumberFormat(initData.preferredNumberFormat);
            setHasSpace(initData.hasSpace);
        }
        if (disabled) {
            setHasError(false);
            setShortSingular('');
            setShortPlural('');
            setLongSingular('');
            setLongPlural('');
            setpreferredNumberFormat('');
            setHasSpace(false);
        }
    }, [initData, disabled]);

    const onSubmit = useCallback(() => {
        try {
            const validated = unitFormSchema.validateSync({
                shortSingular,
                shortPlural: shortPlural === '' ? shortSingular : shortPlural,
                longSingular,
                longPlural: longPlural === '' ? longSingular : longPlural,
                preferredNumberFormat,
                hasSpace,
                unique: true,
            });
            handleSubmit(validated);
        } catch (e: unknown) {
            setHasError(true);
            if (e instanceof ValidationError) {
                toast({
                    title: 'Error saving unit',
                    description: e.message,
                    position: 'top',
                });
            }
        }
    }, [
        hasSpace,
        longPlural,
        longSingular,
        preferredNumberFormat,
        shortPlural,
        shortSingular,
        handleSubmit,
        toast,
    ]);

    useEffect(() => {
        const handleKeyboardEvent = (e: KeyboardEvent) => {
            if (isFocused && e.key === 'Enter') {
                e.preventDefault();
                onSubmit();
            }
        };
        window.addEventListener('keydown', handleKeyboardEvent);

        return () => {
            window.removeEventListener('keydown', handleKeyboardEvent);
        };
    }, [isFocused, onSubmit]);

    return (
        <Stack
            spacing={4}
            pt={3}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...rest}
        >
            <FloatingLabelInput
                inputRef={fieldRef}
                id='short-singular-name'
                label='Short singular name'
                value={shortSingular}
                isInvalid={hasError}
                isRequired
                isDisabled={disabled}
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
                isDisabled={disabled}
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
                isDisabled={disabled}
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
                isDisabled={disabled}
                isInvalid={hasError}
                onChange={(e) => {
                    setLongPlural(e.target.value.toLowerCase());
                    hasError && setHasError(false);
                }}
            />
            <FormControl isDisabled={disabled} isInvalid={hasError}>
                <FormHelperText>Preferred number format</FormHelperText>
                <RadioGroup onChange={setpreferredNumberFormat} value={preferredNumberFormat}>
                    <HStack spacing='12px'>
                        <Radio value='decimal'>decimal</Radio>
                        <Radio value='fraction'>fraction</Radio>
                    </HStack>
                </RadioGroup>
            </FormControl>
            <Checkbox
                isDisabled={disabled}
                isInvalid={hasError}
                onChange={(e) => setHasSpace(e.target.checked)}
                isChecked={hasSpace}
            >
                Space after quantity
            </Checkbox>
            <ButtonGroup
                display='flex'
                justifyContent='flex-end'
                paddingTop={2}
                isDisabled={disabled}
            >
                {handleDelete && (
                    <Button colorScheme='red' onClick={handleDelete} aria-label='Delete unit'>
                        Delete
                    </Button>
                )}
                <Button colorScheme='teal' onClick={onSubmit} aria-label='Save unit'>
                    Save
                </Button>
            </ButtonGroup>
        </Stack>
    );
}
