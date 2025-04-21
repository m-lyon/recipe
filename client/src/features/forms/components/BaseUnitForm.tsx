import { ApolloError } from '@apollo/client';
import { StackProps } from '@chakra-ui/react';
import { boolean, mixed, object, string } from 'yup';
import { Button, ButtonGroup } from '@chakra-ui/react';
import { MutableRefObject, useCallback, useEffect } from 'react';
import { Field, HStack, RadioGroup, Stack } from '@chakra-ui/react';

import { NumberFormat } from '@recipe/graphql/enums';
import { Checkbox, Radio } from '@recipe/common/components';
import { FloatingLabelInput } from '@recipe/common/components';

import { useFormLogic } from '../hooks/useFormLogic';
import { useKeyboardSubmit } from '../hooks/useKeyboardSubmit';

export function formatUnitError(error: ApolloError) {
    if (error.message.startsWith('E11000')) {
        return 'Unit already exists';
    }
    return error.message;
}

export const unitFormSchema = object({
    shortSingular: string().required('Short singular name is required'),
    shortPlural: string().required('Short plural name is required'),
    longSingular: string().required('Long singular name is required'),
    longPlural: string().required('Long plural name is required'),
    preferredNumberFormat: mixed<NumberFormat>()
        .required()
        .oneOf(Object.values(NumberFormat), 'You must select a number format'),
    hasSpace: boolean().required(),
    unique: boolean().required(),
});
export interface BaseUnitFormProps extends StackProps {
    fieldRef?: MutableRefObject<HTMLInputElement | null>;
    initData?: Partial<ModifyableUnit>;
    disabled?: boolean;
    submitForm: (data: ModifyableUnit) => void;
    onDelete?: () => void;
}
export function BaseUnitForm(props: BaseUnitFormProps) {
    const { fieldRef, initData, disabled, submitForm, onDelete, ...rest } = props;
    const xfm = useCallback(
        (data: Partial<ModifyableUnit>) => ({
            shortSingular: data.shortSingular,
            shortPlural: data.shortPlural || data.shortSingular,
            longSingular: data.longSingular,
            longPlural: data.longPlural || data.longSingular,
            preferredNumberFormat: data.preferredNumberFormat,
            hasSpace: data.hasSpace,
            unique: true,
        }),
        []
    );
    const { formData, hasError, handleSubmit, handleChange, setData } =
        useFormLogic<ModifyableUnit>(unitFormSchema, xfm, initData || {}, submitForm, 'unit');
    const { setIsFocused } = useKeyboardSubmit(handleSubmit);

    useEffect(() => {
        if (disabled) {
            setData({
                shortSingular: '',
                shortPlural: '',
                longSingular: '',
                longPlural: '',
                hasSpace: false,
            });
        }
    }, [disabled, setData]);

    return (
        <Stack
            gap={4}
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
                invalid={hasError}
                required
                disabled={disabled}
                onChange={(e) => handleChange('shortSingular', e.target.value.toLowerCase())}
            />
            <FloatingLabelInput
                label='Short plural name'
                id='short-plural-name'
                value={formData.shortPlural || ''}
                invalid={hasError}
                disabled={disabled}
                onChange={(e) => handleChange('shortPlural', e.target.value.toLowerCase())}
            />
            <FloatingLabelInput
                label='Long singular name'
                id='long-singular-name'
                value={formData.longSingular || ''}
                required
                disabled={disabled}
                invalid={hasError}
                onChange={(e) => handleChange('longSingular', e.target.value.toLowerCase())}
            />
            <FloatingLabelInput
                label='Long plural name'
                id='long-plural-name'
                value={formData.longPlural || ''}
                disabled={disabled}
                invalid={hasError}
                onChange={(e) => handleChange('longPlural', e.target.value.toLowerCase())}
            />
            <Field.Root disabled={disabled} invalid={hasError}>
                <Field.HelperText>Preferred number format</Field.HelperText>
                <RadioGroup.Root
                    onValueChange={(e) => handleChange('preferredNumberFormat', e.value)}
                    value={formData.preferredNumberFormat}
                >
                    <HStack gap='12px'>
                        <Radio value='decimal'>decimal</Radio>
                        <Radio value='fraction'>fraction</Radio>
                    </HStack>
                </RadioGroup.Root>
            </Field.Root>
            <Checkbox
                disabled={disabled}
                invalid={hasError}
                onCheckedChange={(e) => handleChange('hasSpace', !!e.checked)}
                checked={formData.hasSpace}
            >
                Space after quantity
            </Checkbox>
            <ButtonGroup display='flex' justifyContent='flex-end' paddingTop={2}>
                {onDelete && (
                    <Button
                        colorPalette='red'
                        disabled={disabled}
                        onClick={onDelete}
                        aria-label='Delete unit'
                    >
                        Delete
                    </Button>
                )}
                <Button
                    colorPalette='teal'
                    disabled={disabled}
                    onClick={handleSubmit}
                    aria-label='Save unit'
                >
                    Save
                </Button>
            </ButtonGroup>
        </Stack>
    );
}
