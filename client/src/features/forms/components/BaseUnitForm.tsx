import { ApolloError } from '@apollo/client';
import { StackProps } from '@chakra-ui/react';
import { MutableRefObject, useMemo } from 'react';
import { boolean, mixed, object, string } from 'yup';
import { Button, ButtonGroup, Checkbox } from '@chakra-ui/react';
import { FormControl, FormHelperText, HStack, Radio, RadioGroup, Stack } from '@chakra-ui/react';

import { FloatingLabelInput } from '@recipe/common/components';

import { useFormLogic } from '../hooks/useFormLogic';
import { useKeyboardSubmit } from '../hooks/useKeyboardSubmit';

export function formatUnitError(error: ApolloError) {
    if (error.message.startsWith('E11000')) {
        return 'Unit already exists';
    }
    return error.message;
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
export interface BaseUnitFormProps extends StackProps {
    fieldRef?: MutableRefObject<HTMLInputElement | null>;
    initData?: Partial<ModifyableUnit>;
    disabled?: boolean;
    onSubmit: (data: ModifyableUnit) => void;
    onDelete?: () => void;
}
export function BaseUnitForm(props: BaseUnitFormProps) {
    const { fieldRef, initData, disabled, onSubmit, onDelete, ...rest } = props;
    const disabledData = useMemo(
        () => ({
            shortSingular: '',
            shortPlural: '',
            longSingular: '',
            longPlural: '',
            hasSpace: false,
        }),
        []
    );
    const xfm = (data: Partial<ModifyableUnit>) => ({
        shortSingular: data.shortSingular,
        shortPlural: data.shortPlural || data.shortSingular,
        longSingular: data.longSingular,
        longPlural: data.longPlural || data.longSingular,
        preferredNumberFormat: data.preferredNumberFormat,
        hasSpace: data.hasSpace,
        unique: true,
    });
    const { formData, hasError, handleSubmit, handleChange } = useFormLogic<ModifyableUnit>(
        unitFormSchema,
        xfm,
        initData,
        onSubmit,
        'unit',
        disabled && disabledData
    );
    const { setIsFocused } = useKeyboardSubmit(handleSubmit);

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
                value={formData.shortSingular || ''}
                isInvalid={hasError}
                isRequired
                isDisabled={disabled}
                onChange={(e) => handleChange('shortSingular', e.target.value.toLowerCase())}
            />
            <FloatingLabelInput
                label='Short plural name'
                id='short-plural-name'
                value={formData.shortPlural || ''}
                isInvalid={hasError}
                isDisabled={disabled}
                onChange={(e) => handleChange('shortPlural', e.target.value.toLowerCase())}
            />
            <FloatingLabelInput
                label='Long singular name'
                id='long-singular-name'
                value={formData.longSingular || ''}
                isRequired
                isDisabled={disabled}
                isInvalid={hasError}
                onChange={(e) => handleChange('longSingular', e.target.value.toLowerCase())}
            />
            <FloatingLabelInput
                label='Long plural name'
                id='long-plural-name'
                value={formData.longPlural || ''}
                isDisabled={disabled}
                isInvalid={hasError}
                onChange={(e) => handleChange('longPlural', e.target.value.toLowerCase())}
            />
            <FormControl isDisabled={disabled} isInvalid={hasError}>
                <FormHelperText>Preferred number format</FormHelperText>
                <RadioGroup
                    onChange={(value) => handleChange('preferredNumberFormat', value)}
                    value={formData.preferredNumberFormat}
                >
                    <HStack spacing='12px'>
                        <Radio value='decimal'>decimal</Radio>
                        <Radio value='fraction'>fraction</Radio>
                    </HStack>
                </RadioGroup>
            </FormControl>
            <Checkbox
                isDisabled={disabled}
                isInvalid={hasError}
                onChange={(e) => handleChange('hasSpace', e.target.checked)}
                isChecked={formData.hasSpace}
            >
                Space after quantity
            </Checkbox>
            <ButtonGroup
                display='flex'
                justifyContent='flex-end'
                paddingTop={2}
                isDisabled={disabled}
            >
                {onDelete && (
                    <Button colorScheme='red' onClick={onDelete} aria-label='Delete unit'>
                        Delete
                    </Button>
                )}
                <Button colorScheme='teal' onClick={handleSubmit} aria-label='Save unit'>
                    Save
                </Button>
            </ButtonGroup>
        </Stack>
    );
}
