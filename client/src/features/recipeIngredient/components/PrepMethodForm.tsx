import { useEffect, useState } from 'react';
import { ValidationError, boolean, object, string } from 'yup';
import { ApolloError, Reference, useMutation } from '@apollo/client';
import { Button, ButtonGroup, Stack, StackProps } from '@chakra-ui/react';

import { UniquePrepMethod } from '@recipe/types';
import { Scalars } from '@recipe/graphql/generated';
import { useErrorToast } from '@recipe/common/hooks';
import { FloatingLabelInput } from '@recipe/common/components';
import { DELETE_PREP_METHOD } from '@recipe/graphql/mutations/prepMethod';
import { PREP_METHOD_FIELDS_FULL } from '@recipe/graphql/queries/prepMethod';
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
    initData?: UniquePrepMethod;
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
    const toast = useErrorToast();
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
                position: 'top',
            });
        },
        update: (cache, { data }) => {
            cache.evict({ id: `PrepMethod:${data?.prepMethodRemoveById?.recordId}` });
        },
    });
    const [savePrepMethod] = useMutation(mutation, {
        onCompleted: handleComplete,
        onError: (error) => {
            toast({
                title: 'Error saving prep method',
                description: formatError(error),
                position: 'top',
            });
        },
        update: (cache, { data }) => {
            cache.modify({
                fields: {
                    prepMethodMany(existingRefs = [], { readField }) {
                        const record =
                            (data as CreatePrepMethodMutation).prepMethodCreateOne?.record ??
                            (data as ModifyPrepMethodMutation).prepMethodUpdateById?.record;
                        if (!record) {
                            return existingRefs;
                        }
                        const newRef = cache.writeFragment({
                            data: record,
                            fragment: PREP_METHOD_FIELDS_FULL,
                            fragmentName: 'PrepMethodFieldsFull',
                        });
                        if (
                            existingRefs.some(
                                (ref: Reference) => readField('_id', ref) === record._id
                            )
                        ) {
                            return existingRefs;
                        }
                        return [...existingRefs, newRef];
                    },
                },
            });
        },
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

    const formSchema = object({
        value: string().required('Prep method is required'),
        unique: boolean().required(),
    });

    const handleSubmit = () => {
        try {
            const validated = formSchema.validateSync({ value, unique: true });
            savePrepMethod({ variables: { record: validated, ...mutationVars } });
        } catch (e: unknown) {
            if (e instanceof ValidationError) {
                setHasError(true);
                toast({
                    title: 'Error saving prep method',
                    description: e.message,
                    position: 'top',
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
            <ButtonGroup display='flex' justifyContent='flex-end' isDisabled={disabled}>
                {mutationVars && (
                    <Button
                        colorScheme='red'
                        onClick={() => deletePrepMethod({ variables: mutationVars })}
                        aria-label='Delete prep method'
                    >
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
