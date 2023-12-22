import { Button, ButtonGroup, Checkbox, FormControl, Stack } from '@chakra-ui/react';
import { TextInput } from '../../../../../components/TextInput';
import { NewPopover } from './NewPopover';
import { NewFormProps } from '../../../types';
import { gql } from '../../../../../__generated__';
import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { useToast } from '@chakra-ui/react';
import { ApolloError } from '@apollo/client';
import { object, string, number, boolean, ValidationError } from 'yup';

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

function formatError(error: ApolloError) {
    if (error.message.startsWith('E11000')) {
        return 'Ingredient already exists';
    }
    return error.message;
}

function NewIngredientForm({ firstFieldRef, onClose, handleSelect }: NewFormProps) {
    const [hasError, setHasError] = useState(false);
    const [name, setName] = useState('');
    const [pluralName, setPluralName] = useState('');
    const [isCountable, setIsCountable] = useState(false);
    const [density, setDensity] = useState('');
    const toast = useToast();
    const [createNewIngredient] = useMutation(CREATE_NEW_INGREDIENT_MUTATION, {
        onCompleted: (data) => {
            onClose();
            handleSelect({
                value: data!.ingredientCreateOne!.record!.name,
                colour: undefined,
                _id: data?.ingredientCreateOne?.record?._id,
            });
            toast({
                title: 'Ingredient created',
                description: `Ingredient ${data?.ingredientCreateOne?.record?.name} created`,
                status: 'success',
                position: 'top',
                duration: 3000,
                isClosable: true,
            });
        },
        onError: (error) => {
            setHasError(true);
            toast({
                title: 'Error creating new ingredient',
                description: formatError(error),
                status: 'error',
                position: 'top',
                duration: 3000,
                isClosable: false,
            });
        },
        refetchQueries: ['GetIngredients'],
    });

    const formSchema = object({
        name: string().required('Name is required'),
        pluralName: string().required('Plural name is required'),
        isCountable: boolean().required(),
        density: number(),
    });

    return (
        <FormControl isInvalid={hasError}>
            <Stack spacing={4}>
                <TextInput
                    placeholder='Name'
                    id='name'
                    ref={firstFieldRef}
                    value={name}
                    onChange={(e) => {
                        setName(e.target.value.toLowerCase());
                        hasError && setHasError(false);
                    }}
                />
                <TextInput
                    placeholder='Plural name'
                    id='plural-name'
                    value={pluralName}
                    onChange={(e) => {
                        setPluralName(e.target.value.toLowerCase());
                        hasError && setHasError(false);
                    }}
                />
                <Checkbox onChange={(e) => setIsCountable(e.target.checked)}>Countable</Checkbox>
                <TextInput
                    placeholder='Density (g/ml)'
                    id='density'
                    value={density ? density : ''}
                    onChange={(e) => {
                        setDensity(e.target.value);
                        hasError && setHasError(false);
                    }}
                />
                <ButtonGroup display='flex' justifyContent='flex-end'>
                    <Button
                        colorScheme='teal'
                        onClick={() => {
                            try {
                                const parsedForm = formSchema.validateSync({
                                    name,
                                    pluralName,
                                    isCountable,
                                    density: density === '' ? undefined : density,
                                });
                                createNewIngredient({ variables: { record: parsedForm } });
                            } catch (e: unknown) {
                                setHasError(true);
                                if (e instanceof ValidationError) {
                                    toast({
                                        title: 'Error creating new ingredient',
                                        description: e.message,
                                        status: 'error',
                                        position: 'top',
                                        duration: 3000,
                                        isClosable: false,
                                    });
                                }
                            }
                        }}
                    >
                        Save
                    </Button>
                </ButtonGroup>
            </Stack>
        </FormControl>
    );
}

export function NewIngredientPopover(props: NewFormProps) {
    return <NewPopover NewForm={NewIngredientForm} formProps={props} title='Add new ingredient' />;
}
