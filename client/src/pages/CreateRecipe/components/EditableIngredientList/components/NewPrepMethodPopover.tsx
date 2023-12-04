import { Button, ButtonGroup, Stack } from '@chakra-ui/react';
import { TextInput } from '../../../../../components/TextInput';
import { NewPopover } from './NewPopover';
import { NewFormProps } from '../../../types';
import { gql } from '../../../../../__generated__';
import { useState } from 'react';
import { useMutation } from '@apollo/client';

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

function NewPrepMethodForm({ firstFieldRef, onClose, handleSelect }: NewFormProps) {
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
                onChange={(e) => setValue(e.target.value)}
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
