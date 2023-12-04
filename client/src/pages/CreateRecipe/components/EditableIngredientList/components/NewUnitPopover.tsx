import { Button, ButtonGroup, Stack } from '@chakra-ui/react';
import { TextInput } from '../../../../../components/TextInput';
import { NewPopover } from './NewPopover';
import { gql } from '../../../../../__generated__';
import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { NewFormProps } from '../../../types';

const CREATE_NEW_UNIT_MUTATION = gql(`
    mutation CreateUnit($record: CreateOneUnitInput!) {
        unitCreateOne(record: $record) {
            record {
                _id
                longSingular
            }
        }
    }
`);

function NewUnitForm({ firstFieldRef, onClose, handleSelect }: NewFormProps) {
    const [shortSingular, setShortSingular] = useState('');
    const [shortPlural, setShortPlural] = useState('');
    const [longSingular, setLongSingular] = useState('');
    const [longPlural, setLongPlural] = useState('');

    const [createNewUnit] = useMutation(CREATE_NEW_UNIT_MUTATION, {
        variables: {
            record: {
                shortSingular,
                shortPlural,
                longSingular,
                longPlural,
            },
        },
        onCompleted: (data) => {
            onClose();
            handleSelect({
                value: data!.unitCreateOne!.record!.longSingular,
                colour: undefined,
                _id: data?.unitCreateOne?.record?._id,
            });
        },
        refetchQueries: ['GetUnits'],
    });

    return (
        <Stack spacing={1} paddingTop={3} paddingLeft={2}>
            <TextInput
                placeholder='Short singular name'
                id='short-singular-name'
                ref={firstFieldRef}
                value={shortSingular}
                onChange={(e) => setShortSingular(e.target.value)}
            />
            <TextInput
                placeholder='Short plural name'
                id='short-plural-name'
                value={shortPlural}
                onChange={(e) => setShortPlural(e.target.value)}
            />
            <TextInput
                placeholder='Long singular name'
                id='long-singular-name'
                value={longSingular}
                onChange={(e) => setLongSingular(e.target.value)}
            />
            <TextInput
                placeholder='Long plural name'
                id='long-plural-name'
                value={longPlural}
                onChange={(e) => setLongPlural(e.target.value)}
            />
            <ButtonGroup display='flex' justifyContent='flex-left' paddingTop={2}>
                <Button colorScheme='teal' onClick={() => createNewUnit()}>
                    Save
                </Button>
            </ButtonGroup>
        </Stack>
    );
}

export function NewUnitPopover(props: NewFormProps) {
    return <NewPopover NewForm={NewUnitForm} formProps={props} title='Add new unit' />;
}
