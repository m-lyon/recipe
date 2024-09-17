import { MutableRefObject, useEffect, useState } from 'react';
import { ValidationError, boolean, object, string } from 'yup';
import { ApolloError, Reference, useMutation } from '@apollo/client';
import { Button, ButtonGroup, Stack, StackProps } from '@chakra-ui/react';

import { useErrorToast } from '@recipe/common/hooks';
import { Scalars, Size } from '@recipe/graphql/generated';
import { DELETE_SIZE } from '@recipe/graphql/mutations/size';
import { FloatingLabelInput } from '@recipe/common/components';
import { SIZE_FIELDS_FULL } from '@recipe/graphql/queries/size';
import { CREATE_SIZE, MODIFY_SIZE } from '@recipe/graphql/mutations/size';
import { CreateSizeMutation, ModifySizeMutation } from '@recipe/graphql/generated';

function formatError(error: ApolloError) {
    if (error.message.startsWith('E11000')) {
        return 'Size already exists';
    }
    return error.message;
}

interface CommonSizeFormProps extends StackProps {
    fieldRef?: MutableRefObject<HTMLInputElement | null>;
    initData?: Size;
    disabled?: boolean;
}
interface CreateSizeFormProps extends CommonSizeFormProps {
    mutation: typeof CREATE_SIZE;
    mutationVars?: never;
    handleComplete: (data: CreateSizeMutation) => void;
    handleDelete?: never;
}
interface ModifySizeFormProps extends CommonSizeFormProps {
    mutation: typeof MODIFY_SIZE;
    mutationVars?: { id: Scalars['MongoID']['input'] };
    handleComplete: (data: ModifySizeMutation) => void;
    handleDelete: () => void;
}
type SizeFormProps = CreateSizeFormProps | ModifySizeFormProps;
export function SizeForm(props: SizeFormProps) {
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
    const [deleteSize] = useMutation(DELETE_SIZE, {
        onCompleted: handleDelete,
        onError: (error) => {
            setHasError(true);
            toast({
                title: 'Error deleting size',
                description: formatError(error),
                position: 'top',
            });
        },
        update: (cache, { data }) => {
            cache.evict({ id: `Size:${data?.sizeRemoveById?.recordId}` });
        },
    });
    const [saveSize] = useMutation(mutation, {
        onCompleted: handleComplete,
        onError: (error) => {
            toast({
                title: 'Error saving size',
                description: formatError(error),
                position: 'top',
            });
        },
        update: (cache, { data }) => {
            cache.modify({
                fields: {
                    sizeMany(existingRefs = [], { readField }) {
                        if (!data) {
                            return existingRefs;
                        }
                        const record =
                            (data satisfies CreateSizeMutation).sizeCreateOne?.record ??
                            (data satisfies ModifySizeMutation as ModifySizeMutation).sizeUpdateById
                                ?.record;
                        if (!record) {
                            return existingRefs;
                        }
                        const newRef = cache.writeFragment({
                            data: record,
                            fragment: SIZE_FIELDS_FULL,
                            fragmentName: 'SizeFieldsFull',
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
        value: string().required('Size is required'),
        unique: boolean().required(),
    });

    const handleSubmit = () => {
        try {
            const validated = formSchema.validateSync({ value, unique: true });
            saveSize({ variables: { record: validated, ...mutationVars } });
        } catch (e: unknown) {
            if (e instanceof ValidationError) {
                setHasError(true);
                toast({
                    title: 'Error saving size',
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
                        onClick={() => deleteSize({ variables: mutationVars })}
                        aria-label='Delete size'
                    >
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
