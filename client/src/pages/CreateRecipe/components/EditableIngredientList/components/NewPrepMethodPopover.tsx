import { Button, ButtonGroup, Stack } from '@chakra-ui/react';
import { TextInput } from '../../../../../components/TextInput';
import { NewPopover } from './NewPopover';
import { NewFormProps } from '../../../types';
import { gql } from '../../../../../__generated__';
import { useState } from 'react';
import { useMutation, ApolloError } from '@apollo/client';
import { useToast } from '@chakra-ui/react';

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
    const toast = useToast();
    const [hasError, setHasError] = useState(false);
    const [value, setValue] = useState('');

    const [createNewPrepMethod] = useMutation(CREATE_NEW_PREP_METHOD_MUTATION, {
        variables: {
            record: {
                value,
            },
        },
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
                isClosable: true,
            });
        },
        onError: (error) => {
            toast({
                title: 'Error creating new prep method',
                description: formatError(error),
                status: 'error',
                position: 'top',
                duration: 3000,
                isClosable: true,
            });
        },
        refetchQueries: ['GetPrepMethods'],
    });
    return (
        <Stack spacing={4}>
            <TextInput
                placeholder='Name'
                id='name'
                ref={firstFieldRef}
                value={value}
                onChange={(e) => {
                    setValue(e.target.value);
                    hasError && setHasError(false);
                }}
            />
            <ButtonGroup
                display='flex'
                justifyContent='flex-end'
                onClick={() => createNewPrepMethod()}
            >
                <Button colorScheme='teal'>Save</Button>
            </ButtonGroup>
        </Stack>
    );
}

export function NewPrepMethodPopover(props: NewFormProps) {
    return <NewPopover NewForm={NewPrepMethodForm} formProps={props} title='Add new prep method' />;
}
