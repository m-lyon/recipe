import { ApolloError } from '@apollo/client';
import { ValidationError, boolean, object, string } from 'yup';
import { Button, ButtonGroup, Stack, StackProps } from '@chakra-ui/react';
import { MutableRefObject, useCallback, useEffect, useState } from 'react';

import { useErrorToast } from '@recipe/common/hooks';
import { FloatingLabelInput } from '@recipe/common/components';

export function formatPrepMethodError(error: ApolloError) {
    if (error.message.startsWith('E11000')) {
        return 'Prep method already exists';
    }
    return error.message;
}

export type PrepMethodFormData = ReturnType<typeof formSchema.validateSync>;
export interface BasePrepMethodFormProps extends StackProps {
    fieldRef?: MutableRefObject<HTMLInputElement | null>;
    initData?: ModifyablePrepMethod;
    disabled?: boolean;
    handleSubmit: (data: PrepMethodFormData) => void;
    handleDelete?: () => void;
}

const formSchema = object({
    value: string().required('Prep method is required'),
    unique: boolean().required(),
});

export function BasePrepMethodForm(props: BasePrepMethodFormProps) {
    const { fieldRef, initData, disabled, handleSubmit, handleDelete, ...rest } = props;
    const toast = useErrorToast();
    const [hasError, setHasError] = useState(false);
    const [value, setValue] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
        if (initData) {
            setValue(initData.value);
        }
        if (disabled) {
            setHasError(false);
            setValue('');
        }
    }, [initData, disabled]);

    const onSubmit = useCallback(() => {
        try {
            const validated = formSchema.validateSync({ value, unique: true });
            handleSubmit(validated);
        } catch (e: unknown) {
            setHasError(true);
            if (e instanceof ValidationError) {
                toast({
                    title: 'Error saving prep method',
                    description: e.message,
                    position: 'top',
                });
            }
        }
    }, [value, handleSubmit, toast]);

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
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...rest}
        >
            <FloatingLabelInput
                label='Name'
                id='name'
                inputRef={fieldRef}
                value={value}
                isInvalid={hasError}
                isRequired
                isDisabled={disabled}
                onChange={(e) => {
                    setValue(e.target.value.toLowerCase());
                    hasError && setHasError(false);
                }}
            />
            <ButtonGroup
                display='flex'
                justifyContent='flex-end'
                paddingTop={2}
                isDisabled={disabled}
            >
                {handleDelete && (
                    <Button
                        colorScheme='red'
                        onClick={handleDelete}
                        aria-label='Delete prep method'
                    >
                        Delete
                    </Button>
                )}
                <Button colorScheme='teal' onClick={onSubmit} aria-label='Save prep method'>
                    Save
                </Button>
            </ButtonGroup>
        </Stack>
    );
}
