import { Text } from '@chakra-ui/react';
import { ApolloError } from '@apollo/client';
import { StackProps } from '@chakra-ui/react';
import { boolean, mixed, object, string } from 'yup';
import { MutableRefObject, useCallback, useEffect } from 'react';
import { Box, Button, ButtonGroup, Checkbox, HStack, RadioGroup, Stack } from '@chakra-ui/react';

import { NumberFormat } from '@recipe/graphql/enums';
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
                isInvalid={hasError}
                isRequired
                disabled={disabled}
                onChange={(e) => handleChange('shortSingular', e.target.value.toLowerCase())}
            />
            <FloatingLabelInput
                label='Short plural name'
                id='short-plural-name'
                value={formData.shortPlural || ''}
                isInvalid={hasError}
                disabled={disabled}
                onChange={(e) => handleChange('shortPlural', e.target.value.toLowerCase())}
            />
            <FloatingLabelInput
                label='Long singular name'
                id='long-singular-name'
                value={formData.longSingular || ''}
                isRequired
                disabled={disabled}
                isInvalid={hasError}
                onChange={(e) => handleChange('longSingular', e.target.value.toLowerCase())}
            />
            <FloatingLabelInput
                label='Long plural name'
                id='long-plural-name'
                value={formData.longPlural || ''}
                disabled={disabled}
                isInvalid={hasError}
                onChange={(e) => handleChange('longPlural', e.target.value.toLowerCase())}
            />
            <Box>
                <Text mb={2} fontSize='sm' color={hasError ? 'red.500' : 'gray.600'}>
                    Preferred number format
                </Text>
                <RadioGroup.Root
                    onValueChange={(details) =>
                        handleChange('preferredNumberFormat', details.value)
                    }
                    value={formData.preferredNumberFormat}
                    disabled={disabled}
                >
                    <HStack gap='12px'>
                        <RadioGroup.Item value='decimal'>
                            <RadioGroup.ItemControl />
                            <RadioGroup.ItemText>decimal</RadioGroup.ItemText>
                        </RadioGroup.Item>
                        <RadioGroup.Item value='fraction'>
                            <RadioGroup.ItemControl />
                            <RadioGroup.ItemText>fraction</RadioGroup.ItemText>
                        </RadioGroup.Item>
                    </HStack>
                </RadioGroup.Root>
            </Box>
            <Checkbox.Root
                disabled={disabled}
                onCheckedChange={(details) => handleChange('hasSpace', details.checked)}
                checked={formData.hasSpace}
            >
                <Checkbox.Control />
                <Checkbox.Label>Space after quantity</Checkbox.Label>
            </Checkbox.Root>
            <ButtonGroup display='flex' justifyContent='flex-end' paddingTop={2}>
                {onDelete && (
                    <Button colorPalette='red' onClick={onDelete} aria-label='Delete unit'>
                        Delete
                    </Button>
                )}
                <Button colorPalette='teal' onClick={handleSubmit} aria-label='Save unit'>
                    Save
                </Button>
            </ButtonGroup>
        </Stack>
    );
}
