import { useState, useContext } from 'react';
import { useMutation, ApolloError } from '@apollo/client';
import { PopoverCloseButton, PopoverContent } from '@chakra-ui/react';
import { Button, ButtonGroup, Checkbox, Stack } from '@chakra-ui/react';
import { PopoverHeader, PopoverArrow, useToast } from '@chakra-ui/react';
import { object, string, number, boolean, ValidationError } from 'yup';

import { gql } from '../../../../../__generated__';
import { IngredientSuggestion } from './IngredientDropdownList';
import { UserContext } from '../../../../../context/UserContext';
import { EnumRecipeIngredientType, User } from '../../../../../__generated__/graphql';
import { FloatingLabelInput } from '../../../../../components/FloatingLabelInput';

const CREATE_NEW_INGREDIENT_MUTATION = gql(`
    mutation CreateIngredient($record: CreateOneIngredientInput!) {
        ingredientCreateOne(record: $record) {
            record {
                _id
                name
                pluralName
                isCountable
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

interface NewIngredientFormProps {
    firstFieldRef: React.MutableRefObject<HTMLInputElement | null>;
    onClose: () => void;
    handleSelect: (item: IngredientSuggestion) => void;
}
function NewIngredientForm({ firstFieldRef, onClose, handleSelect }: NewIngredientFormProps) {
    const [userContext] = useContext(UserContext);
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
                value: {
                    ...data!.ingredientCreateOne!.record!,
                    type: 'ingredient' as EnumRecipeIngredientType,
                },
                colour: undefined,
            });
            toast({
                title: 'Ingredient created',
                description: `Ingredient ${data?.ingredientCreateOne?.record?.name} created`,
                status: 'success',
                position: 'top',
                duration: 3000,
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
        <Stack spacing={4}>
            <FloatingLabelInput
                label='Name'
                id='name'
                firstFieldRef={firstFieldRef}
                value={name}
                isInvalid={hasError}
                onChange={(e) => {
                    setName(e.target.value.toLowerCase());
                    hasError && setHasError(false);
                }}
            />
            <FloatingLabelInput
                label='Plural name'
                id='plural-name'
                value={pluralName}
                isInvalid={hasError}
                onChange={(e) => {
                    setPluralName(e.target.value.toLowerCase());
                    hasError && setHasError(false);
                }}
            />
            <Checkbox onChange={(e) => setIsCountable(e.target.checked)}>Countable</Checkbox>
            <FloatingLabelInput
                label='Density (g/ml)'
                id='density'
                value={density ? density : ''}
                isInvalid={hasError}
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
                            const user = userContext as User;
                            const validated = formSchema.validateSync({
                                name,
                                pluralName,
                                isCountable,
                                density: density === '' ? undefined : density,
                            });
                            createNewIngredient({
                                variables: { record: { ...validated, owner: user._id } },
                            });
                        } catch (e: unknown) {
                            setHasError(true);
                            if (e instanceof ValidationError) {
                                toast({
                                    title: 'Error creating new ingredient',
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

export function NewIngredientPopover(props: NewIngredientFormProps) {
    return (
        <PopoverContent paddingRight={4} paddingBottom={3} paddingLeft={2}>
            <PopoverArrow />
            <PopoverCloseButton />
            <PopoverHeader border={'hidden'}>Add new ingredient</PopoverHeader>
            <NewIngredientForm {...props} />
        </PopoverContent>
    );
}
