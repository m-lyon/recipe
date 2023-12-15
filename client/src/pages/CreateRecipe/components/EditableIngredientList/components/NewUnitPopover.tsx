import { Button, ButtonGroup, FormControl, Stack } from '@chakra-ui/react';
import { TextInput } from '../../../../../components/TextInput';
import { NewPopover } from './NewPopover';
import { gql } from '../../../../../__generated__';
import { useState } from 'react';
import { ApolloError, useMutation } from '@apollo/client';
import { NewFormProps } from '../../../types';
import { useToast } from '@chakra-ui/react';

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

function formatError(error: ApolloError) {
    if (error.message.startsWith('E11000')) {
        return 'Unit already exists';
    }
    return error.message;
}

function NewUnitForm({ firstFieldRef, onClose, handleSelect }: NewFormProps) {
    const [hasError, setHasError] = useState(false);
    const toast = useToast();
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
            toast({
                title: 'Unit created',
                description: `Unit ${data?.unitCreateOne?.record?.longSingular} created`,
                status: 'success',
                position: 'top',
                duration: 3000,
                isClosable: true,
            });
        },
        onError: (error) => {
            toast({
                title: 'Error creating new unit',
                description: formatError(error),
                status: 'error',
                position: 'top',
                duration: 3000,
                isClosable: true,
            });
            setHasError(true);
        },
        refetchQueries: ['GetUnits'],
    });

    return (
        <FormControl isInvalid={hasError}>
            <Stack spacing={1} paddingTop={3} paddingLeft={2}>
                <TextInput
                    placeholder='Short singular name'
                    id='short-singular-name'
                    ref={firstFieldRef}
                    value={shortSingular}
                    onChange={(e) => {
                        setShortSingular(e.target.value.toLowerCase());
                        hasError && setHasError(false);
                    }}
                />
                <TextInput
                    placeholder='Short plural name'
                    id='short-plural-name'
                    value={shortPlural}
                    onChange={(e) => {
                        setShortPlural(e.target.value.toLowerCase());
                        hasError && setHasError(false);
                    }}
                />
                <TextInput
                    placeholder='Long singular name'
                    id='long-singular-name'
                    value={longSingular}
                    onChange={(e) => {
                        setLongSingular(e.target.value.toLowerCase());
                        hasError && setHasError(false);
                    }}
                />
                <TextInput
                    placeholder='Long plural name'
                    id='long-plural-name'
                    value={longPlural}
                    onChange={(e) => {
                        setLongPlural(e.target.value.toLowerCase());
                        hasError && setHasError(false);
                    }}
                />
                <ButtonGroup display='flex' justifyContent='flex-left' paddingTop={2}>
                    <Button colorScheme='teal' onClick={() => createNewUnit()}>
                        Save
                    </Button>
                </ButtonGroup>
            </Stack>
        </FormControl>
    );
}

export function NewUnitPopover(props: NewFormProps) {
    return <NewPopover NewForm={NewUnitForm} formProps={props} title='Add new unit' />;
}
