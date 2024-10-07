import { MutableRefObject } from 'react';
import { ApolloError } from '@apollo/client';
import { boolean, object, string } from 'yup';
import { Button, ButtonGroup, Stack, StackProps } from '@chakra-ui/react';

import { FloatingLabelInput } from '@recipe/common/components';

import { useFormLogic } from '../hooks/useFormLogic';
import { useKeyboardSubmit } from '../hooks/useKeyboardSubmit';

export function formatSizeError(error: ApolloError) {
    if (error.message.startsWith('E11000')) {
        return 'Size already exists';
    }
    return error.message;
}

export interface BaseSizeFormProps extends StackProps {
    fieldRef?: MutableRefObject<HTMLInputElement | null>;
    initData?: ModifyableSize;
    disabled?: boolean;
    onSubmit: (data: ModifyableSize) => void;
    onDelete?: () => void;
}
const formSchema = object({
    value: string().required('Size is required'),
    unique: boolean().required(),
});

export function BaseSizeForm(props: BaseSizeFormProps) {
    const { fieldRef, initData, disabled, onSubmit, onDelete, ...rest } = props;
    const { formData, hasError, handleSubmit, handleChange } = useFormLogic<ModifyableSize>(
        formSchema,
        initData,
        onSubmit,
        'Error saving prep method'
    );
    const { setIsFocused } = useKeyboardSubmit(handleSubmit);

    return (
        <Stack
            spacing={4}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...rest}
        >
            <FloatingLabelInput
                label='Name'
                id='name'
                inputRef={fieldRef}
                value={formData.value || ''}
                isInvalid={hasError}
                isRequired
                isDisabled={disabled}
                onChange={(e) => handleChange('value', e.target.value.toLowerCase())}
            />
            <ButtonGroup display='flex' justifyContent='flex-end' isDisabled={disabled}>
                {onDelete && (
                    <Button colorScheme='red' onClick={onDelete} aria-label='Delete size'>
                        Delete
                    </Button>
                )}
                <Button colorScheme='teal' onClick={handleSubmit} aria-label='Save size'>
                    Save
                </Button>
            </ButtonGroup>
        </Stack>
    );
}
