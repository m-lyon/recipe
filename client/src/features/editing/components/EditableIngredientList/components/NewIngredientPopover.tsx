import { useEffect, useState } from 'react';
import { ApolloError, useMutation } from '@apollo/client';
import { PopoverCloseButton, PopoverContent } from '@chakra-ui/react';
import { ValidationError, boolean, number, object, string } from 'yup';
import { Button, ButtonGroup, Checkbox, Stack } from '@chakra-ui/react';
import { PopoverArrow, PopoverHeader, useToast } from '@chakra-ui/react';

import { IngredientSuggestion } from './IngredientDropdown';
import { CREATE_INGREDIENT } from '../../../../../graphql/mutations/ingredient';
import { FloatingLabelInput } from '../../../../../components/FloatingLabelInput';

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
function NewIngredientForm(props: NewIngredientFormProps) {
    const { firstFieldRef, onClose, handleSelect } = props;
    const [hasError, setHasError] = useState(false);
    const [name, setName] = useState('');
    const [pluralName, setPluralName] = useState('');
    const [isCountable, setIsCountable] = useState(false);
    const [density, setDensity] = useState('');
    const toast = useToast();
    const [isFocused, setIsFocused] = useState(false);
    const [createNewIngredient] = useMutation(CREATE_INGREDIENT, {
        onCompleted: (data) => {
            onClose();
            handleSelect({
                value: data!.ingredientCreateOne!.record!,
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
        pluralName: string().required(),
        isCountable: boolean().required(),
        density: number(),
    });

    const handleSubmit = () => {
        try {
            const validated = formSchema.validateSync({
                name,
                pluralName: pluralName === '' ? name : pluralName,
                isCountable,
                density: density === '' ? undefined : density,
            });
            createNewIngredient({ variables: { record: { ...validated } } });
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
        <Stack spacing={4} onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)}>
            <FloatingLabelInput
                label='Name'
                id='name'
                firstFieldRef={firstFieldRef}
                value={name}
                isInvalid={hasError}
                isRequired
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
            <Checkbox onChange={(e) => setIsCountable(e.target.checked)}>Countable</Checkbox>
            <ButtonGroup display='flex' justifyContent='flex-end'>
                <Button colorScheme='teal' onClick={handleSubmit}>
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
            <PopoverHeader border='hidden'>Add new ingredient</PopoverHeader>
            <NewIngredientForm {...props} />
        </PopoverContent>
    );
}
