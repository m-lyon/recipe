import { ApolloError } from '@apollo/client';
import { object, string } from 'yup';
import { MutableRefObject, useCallback, useEffect } from 'react';
import { Button, Group, Stack, Textarea, TextInput } from '@mantine/core';

import { useFormLogic } from '@recipe/features/forms/hooks/useFormLogic';
import { useKeyboardSubmit } from '@recipe/features/forms/hooks/useKeyboardSubmit';

export function formatKeyPhraseError(error: ApolloError) {
    if (error.message.startsWith('E11000')) {
        return 'Key phrase already exists';
    }
    return error.message;
}

const formSchema = object({
    value: string().required('Key phrase is required'),
    description: string().required('Description is required'),
});

export interface BaseKeyPhraseFormProps {
    fieldRef?: MutableRefObject<HTMLInputElement | null>;
    initData?: Partial<ModifyableKeyPhrase>;
    disabled?: boolean;
    submitForm: (data: ModifyableKeyPhrase) => void;
    onDelete?: () => void;
    style?: React.CSSProperties;
}
export function BaseKeyPhraseForm(props: BaseKeyPhraseFormProps) {
    const { fieldRef, initData, disabled, submitForm, onDelete, style } = props;
    const xfm = useCallback(
        (data: Partial<ModifyableKeyPhrase>) => ({
            value: data.value,
            description: data.description,
        }),
        []
    );
    const { formData, hasError, handleSubmit, handleChange, setData } =
        useFormLogic<ModifyableKeyPhrase>(
            formSchema,
            xfm,
            initData || {},
            submitForm,
            'key phrase'
        );
    const { setIsFocused } = useKeyboardSubmit(handleSubmit);

    useEffect(() => {
        if (disabled) {
            setData({ value: '', description: '' });
        }
    }, [disabled, setData]);

    return (
        <Stack
            gap='sm'
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            style={style}
        >
            <TextInput
                label='Value'
                ref={fieldRef}
                value={formData.value || ''}
                error={hasError}
                required
                disabled={disabled}
                onChange={(e) => handleChange('value', e.target.value.toLowerCase())}
            />
            <Textarea
                label='Description'
                value={formData.description || ''}
                error={hasError}
                required
                disabled={disabled}
                onChange={(e) => handleChange('description', e.target.value)}
            />
            <Group justify='flex-end' pt='xs'>
                {onDelete && (
                    <Button color='red' onClick={onDelete} aria-label='Delete key phrase' disabled={disabled}>
                        Delete
                    </Button>
                )}
                <Button onClick={handleSubmit} aria-label='Save key phrase' disabled={disabled}>
                    Save
                </Button>
            </Group>
        </Stack>
    );
}
