import { ApolloError } from '@apollo/client';
import { boolean, object, string } from 'yup';
import { MutableRefObject, useCallback, useEffect } from 'react';
import { Button, ButtonGroup, Stack, StackProps } from '@chakra-ui/react';

import type { Owner } from '@recipe/common/components';
import { FloatingLabelInput, OwnerText } from '@recipe/common/components';

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
    initData?: Partial<ModifyableSize>;
    disabled?: boolean;
    submitForm: (data: ModifyableSize) => void;
    onDelete?: () => void;
    owner?: Owner | null;
}
const formSchema = object({
    value: string().required('Size is required'),
    unique: boolean().required(),
});

export function BaseSizeForm(props: BaseSizeFormProps) {
    const { fieldRef, initData, disabled, submitForm, onDelete, owner, ...rest } = props;
    const xfm = useCallback(
        (data: Partial<ModifyableSize>) => ({ value: data.value, unique: true }),
        []
    );
    const { formData, hasError, handleSubmit, handleChange, setData } =
        useFormLogic<ModifyableSize>(formSchema, xfm, initData || {}, submitForm, 'size');
    const { setIsFocused } = useKeyboardSubmit(handleSubmit);

    useEffect(() => {
        if (disabled) {
            setData({ value: '' });
        }
    }, [disabled, setData]);

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
                <OwnerText owner={owner} />
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
