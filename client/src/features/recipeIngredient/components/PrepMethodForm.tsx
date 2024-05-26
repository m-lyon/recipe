import { useEffect, useState } from 'react';
import { ValidationError, object, string } from 'yup';
import { ApolloError, useMutation } from '@apollo/client';
import { Button, ButtonGroup, Stack, StackProps, useToast } from '@chakra-ui/react';

import { FloatingLabelInput } from '@recipe/common/components';
import { PrepMethod, Scalars } from '@recipe/graphql/generated';
import { DELETE_PREP_METHOD } from '@recipe/graphql/mutations/prepMethod';
import { CREATE_PREP_METHOD, MODIFY_PREP_METHOD } from '@recipe/graphql/mutations/prepMethod';
import { CreatePrepMethodMutation, ModifyPrepMethodMutation } from '@recipe/graphql/generated';

function formatError(error: ApolloError) {
    if (error.message.startsWith('E11000')) {
        return 'Prep method already exists';
    }
    return error.message;
}

interface CommonPrepMethodFormProps extends StackProps {
    fieldRef?: React.MutableRefObject<HTMLInputElement | null>;
    initData?: PrepMethod;
    disabled?: boolean;
}
interface CreatePrepMethodFormProps extends CommonPrepMethodFormProps {
    mutation: typeof CREATE_PREP_METHOD;
    mutationVars?: never;
    handleComplete: (data: CreatePrepMethodMutation) => void;
    handleDelete?: never;
}
interface ModifyPrepMethodFormProps extends CommonPrepMethodFormProps {
    mutation: typeof MODIFY_PREP_METHOD;
    mutationVars?: { id: Scalars['MongoID']['input'] };
    handleComplete: (data: ModifyPrepMethodMutation) => void;
    handleDelete: () => void;
}
type PrepMethoFormProps = CreatePrepMethodFormProps | ModifyPrepMethodFormProps;
export function PrepMethodForm(props: PrepMethoFormProps) {
    const {
        fieldRef,
        mutation,
        mutationVars,
        handleComplete,
        handleDelete,
        initData,
        disabled,
        ...rest
    } = props;
    const toast = useToast();
    const [hasError, setHasError] = useState(false);
    const [value, setValue] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [deletePrepMethod] = useMutation(DELETE_PREP_METHOD, {
        onCompleted: handleDelete,
        onError: (error) => {
            setHasError(true);
            toast({
                title: 'Error deleting prep method',
                description: formatError(error),
                status: 'error',
                position: 'top',
                duration: 3000,
            });
        },
        refetchQueries: ['GetPrepMethods'],
    });
    const [savePrepMethod] = useMutation(mutation, {
        onCompleted: handleComplete,
        onError: (error) => {
            toast({
                title: 'Error saving prep method',
                description: formatError(error),
                status: 'error',
                position: 'top',
                duration: 3000,
            });
        },
        refetchQueries: ['GetPrepMethods'],
    });

    useEffect(() => {
        if (initData) {
            setValue(initData.value);
        }
        if (disabled) {
            setHasError(false);
            setValue('');
        }
    }, [initData, disabled]);

    const formSchema = object({ value: string().required('Prep method is required') });

    const handleSubmit = () => {
        try {
            const validated = formSchema.validateSync({ value });
            savePrepMethod({ variables: { record: validated, ...mutationVars } });
        } catch (e: unknown) {
            if (e instanceof ValidationError) {
                setHasError(true);
                toast({
                    title: 'Error saving prep method',
                    description: e.message,
                    status: 'error',
                    position: 'top',
                    duration: 3000,
                });
            }
        }
    };

    useEffect(() => {
        const handleKeyboardEvent = (e: KeyboardEvent) => {
            if (isFocused && e.key === 'Enter') {
                e.preventDefault();
                handleSubmit();
            }
        };

        window.addEventListener('keydown', handleKeyboardEvent);

        return () => {
            window.removeEventListener('keydown', handleKeyboardEvent);
        };
    });

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
                firstFieldRef={fieldRef}
                value={value}
                isInvalid={hasError}
                isRequired
                isDisabled={disabled}
                onChange={(e) => {
                    setValue(e.target.value.toLowerCase());
                    hasError && setHasError(false);
                }}
            />
            <ButtonGroup display='flex' justifyContent='flex-end' isDisabled={disabled}>
                {mutationVars && (
                    <Button
                        colorScheme='red'
                        onClick={() => deletePrepMethod({ variables: mutationVars })}
                    >
                        Delete
                    </Button>
                )}
                <Button colorScheme='teal' onClick={handleSubmit}>
                    Save
                </Button>
            </ButtonGroup>
        </Stack>
    );
}
