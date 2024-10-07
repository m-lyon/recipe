import { MutableRefObject } from 'react';
import { ApolloError } from '@apollo/client';
import { boolean, object, string } from 'yup';
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
    initData?: ModifyablePrepMethod;
    disabled?: boolean;
    onSubmit: (data: ModifyablePrepMethod) => void;
    onDelete?: () => void;
}
export function BasePrepMethodForm(props: BasePrepMethodFormProps) {
    const { fieldRef, initData, disabled, onSubmit, onDelete, ...rest } = props;
    const { formData, hasError, handleSubmit, handleChange } = useFormLogic<ModifyablePrepMethod>(
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
            <ButtonGroup
                display='flex'
                justifyContent='flex-end'
                paddingTop={2}
                isDisabled={disabled}
            >
                {onDelete && (
                    <Button colorScheme='red' onClick={onDelete} aria-label='Delete prep method'>
                        Delete
                    </Button>
                )}
                <Button colorScheme='teal' onClick={handleSubmit} aria-label='Save prep method'>
                    Save
                </Button>
            </ButtonGroup>
        </Stack>
    );
}
