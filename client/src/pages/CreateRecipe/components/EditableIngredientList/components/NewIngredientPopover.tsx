import { Button, ButtonGroup, Stack } from '@chakra-ui/react';
import { TextInput } from '../../../../../components/TextInput';
import { NewPopover } from './NewPopover';
import { NewFormProps } from '../../../types';
import { gql } from '../../../../../__generated__';
import { useState } from 'react';
import { useMutation } from '@apollo/client';

const CREATE_NEW_INGREDIENT_MUTATION = gql(`
    mutation CreateIngredient($record: CreateOneIngredientInput!) {
        ingredientCreateOne(record: $record) {
            record {
                _id
                name
            }
        }
    }
`);

function NewIngredientForm({ firstFieldRef, onClose, handleSelect }: NewFormProps) {
    const [name, setName] = useState('');

    const [createNewIngredient] = useMutation(CREATE_NEW_INGREDIENT_MUTATION, {
        variables: {
            record: {
                name,
            },
        },
        onCompleted: (data) => {
            onClose();
            handleSelect({
                value: data!.ingredientCreateOne!.record!.name,
                colour: undefined,
                _id: data?.ingredientCreateOne?.record?._id,
            });
        },
        refetchQueries: ['GetIngredients'],
    });

    return (
        <Stack spacing={4}>
            <TextInput
                placeholder='Name'
                id='name'
                ref={firstFieldRef}
                value={name}
                onChange={(e) => setName(e.target.value)}
            />
            <ButtonGroup display='flex' justifyContent='flex-end'>
                <Button colorScheme='teal' onClick={() => createNewIngredient()}>
                    Save
                </Button>
            </ButtonGroup>
        </Stack>
    );
}

export function NewIngredientPopover(props: NewFormProps) {
    return <NewPopover NewForm={NewIngredientForm} formProps={props} title='Add new ingredient' />;
}
