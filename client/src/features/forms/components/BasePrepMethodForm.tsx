import { ApolloError } from '@apollo/client';
import { boolean, object, string } from 'yup';
import { MutableRefObject, useCallback, useEffect } from 'react';
import { Button, ButtonGroup, Stack, StackProps } from '@chakra-ui/react';

import { FloatingLabelInput } from '@recipe/common/components';

import { useFormLogic } from '../hooks/useFormLogic';
import { useKeyboardSubmit } from '../hooks/useKeyboardSubmit';

export function formatPrepMethodError(error: ApolloError) {
    if (error.message.startsWith('E11000')) {
        return 'Prep method already exists';
    }
    return error.message;
}

const formSchema = object({
    value: string().required('Prep method is required'),
    unique: boolean().required(),
});

export interface BasePrepMethodFormProps extends StackProps {
    fieldRef?: MutableRefObject<HTMLInputElement | null>;
    initData?: Partial<ModifyablePrepMethod>;
    disabled?: boolean;
    submitForm: (data: ModifyablePrepMethod) => void;
    onDelete?: () => void;
}
export function BasePrepMethodForm(props: BasePrepMethodFormProps) {
    const { fieldRef, initData, disabled, submitForm, onDelete, ...rest } = props;
    const xfm = useCallback(
        (data: Partial<ModifyablePrepMethod>) => ({ value: data.value, unique: true }),
        []
    );
    const { formData, hasError, handleSubmit, handleChange, setData } =
        useFormLogic<ModifyablePrepMethod>(
            formSchema,
            xfm,
            initData || {},
            submitForm,
            'prep method'
        );
    const { setIsFocused } = useKeyboardSubmit(handleSubmit);

    useEffect(() => {
        if (disabled) {
            setData({ value: '' });
        }
    }, [disabled, setData]);

    return (
        <Stack
            gap={4}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...rest}
        >
            <FloatingLabelInput
                label='Name'
                id='name'
                inputRef={fieldRef}
                value={formData.value || ''}
                invalid={hasError}
                isRequired
                disabled={disabled}
                onChange={(e) => handleChange('value', e.target.value.toLowerCase())}
            />
            <ButtonGroup
                display='flex'
                justifyContent='flex-end'
                paddingTop={2}
                disabled={disabled}
            >
                {onDelete && (
                    <Button colorPalette='red' onClick={onDelete} aria-label='Delete prep method'>
                        Delete
                    </Button>
                )}
                <Button colorPalette='teal' onClick={handleSubmit} aria-label='Save prep method'>
                    Save
                </Button>
            </ButtonGroup>
        </Stack>
    );
}
