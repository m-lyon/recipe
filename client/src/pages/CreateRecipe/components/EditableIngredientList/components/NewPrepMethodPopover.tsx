import { useState, useContext } from 'react';
import { object, string, ValidationError } from 'yup';
import { useMutation, ApolloError } from '@apollo/client';
import { Button, ButtonGroup, Stack, useToast } from '@chakra-ui/react';

import { NewPopover } from './NewPopover';
import { NewFormProps } from '../../../types';
import { gql } from '../../../../../__generated__';
import { User } from '../../../../../__generated__/graphql';
import { UserContext } from '../../../../../context/UserContext';
import { FloatingLabelInput } from '../../../../../components/FloatingLabelInput';

const CREATE_NEW_PREP_METHOD_MUTATION = gql(`
    mutation CreatePrepMethod($record: CreateOnePrepMethodInput!) {
        prepMethodCreateOne(record: $record) {
            record {
                _id
                value
            }
        }
    }
`);

function formatError(error: ApolloError) {
    if (error.message.startsWith('E11000')) {
        return 'Prep method already exists';
    }
    return error.message;
}

function NewPrepMethodForm({ firstFieldRef, onClose, handleSelect }: NewFormProps) {
    const [userContext] = useContext(UserContext);
    const toast = useToast();
    const [hasError, setHasError] = useState(false);
    const [value, setValue] = useState('');

    const [createNewPrepMethod] = useMutation(CREATE_NEW_PREP_METHOD_MUTATION, {
        onCompleted: (data) => {
            onClose();
            handleSelect({
                value: data!.prepMethodCreateOne!.record!.value,
                colour: undefined,
                _id: data?.prepMethodCreateOne?.record?._id,
            });
            toast({
                title: 'Prep method created',
                description: `Prep method ${data?.prepMethodCreateOne?.record?.value} created`,
                status: 'success',
                position: 'top',
                duration: 3000,
            });
        },
        onError: (error) => {
            toast({
                title: 'Error creating new prep method',
                description: formatError(error),
                status: 'error',
                position: 'top',
                duration: 3000,
            });
        },
        refetchQueries: ['GetPrepMethods'],
    });

    const formSchema = object({ value: string().required('Prep method is required') });

    return (
        <Stack spacing={4}>
            <FloatingLabelInput
                label='Name'
                id='name'
                firstFieldRef={firstFieldRef}
                value={value}
                isInvalid={hasError}
                onChange={(e) => {
                    setValue(e.target.value.toLowerCase());
                    hasError && setHasError(false);
                }}
            />
            <ButtonGroup display='flex' justifyContent='flex-end'>
                <Button
                    colorScheme='teal'
                    onClick={() => {
                        try {
                            const validated = formSchema.validateSync({ value });
                            const user = userContext as User;
                            createNewPrepMethod({
                                variables: {
                                    record: {
                                        ...validated,
                                        owner: user._id,
                                    },
                                },
                            });
                        } catch (e: unknown) {
                            if (e instanceof ValidationError) {
                                setHasError(true);
                                toast({
                                    title: 'Error creating new prep method',
                                    description: e.message,
                                    status: 'error',
                                    position: 'top',
                                    duration: 3000,
                                });
                            }
                        }
                    }}
                >
                    Save
                </Button>
            </ButtonGroup>
        </Stack>
    );
}

export function NewPrepMethodPopover(props: NewFormProps) {
    return <NewPopover NewForm={NewPrepMethodForm} formProps={props} title='Add new prep method' />;
}
