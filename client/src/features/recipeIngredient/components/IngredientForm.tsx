import { useEffect, useState } from 'react';
import { ApolloError, useMutation } from '@apollo/client';
import { ValidationError, boolean, number, object, string } from 'yup';
import { Button, ButtonGroup, Checkbox, Stack, StackProps, useToast } from '@chakra-ui/react';

import { FloatingLabelInput } from '@recipe/common/components';
import { Ingredient, Scalars } from '@recipe/graphql/generated';
import { CREATE_INGREDIENT, MODIFY_INGREDIENT } from '@recipe/graphql/mutations/ingredient';
import { CreateIngredientMutation, ModifyIngredientMutation } from '@recipe/graphql/generated';

function formatError(error: ApolloError) {
    if (error.message.startsWith('E11000')) {
        return 'Ingredient already exists';
    }
    return error.message;
}

interface CommonIngredientFormProps extends StackProps {
    fieldRef?: React.MutableRefObject<HTMLInputElement | null>;
    initData?: Ingredient;
    disabled?: boolean;
}
interface CreateIngredientFormProps extends CommonIngredientFormProps {
    mutation: typeof CREATE_INGREDIENT;
    mutationVars?: never;
    handleComplete: (data: CreateIngredientMutation) => void;
}
interface ModifyIngredientFormProps extends CommonIngredientFormProps {
    mutation: typeof MODIFY_INGREDIENT;
    mutationVars?: { id: Scalars['MongoID']['input'] };
    handleComplete: (data: ModifyIngredientMutation) => void;
}
type IngredientFormProps = CreateIngredientFormProps | ModifyIngredientFormProps;
export function IngredientForm(props: IngredientFormProps) {
    const { fieldRef, mutation, mutationVars, handleComplete, initData, disabled, ...rest } = props;
    const [hasError, setHasError] = useState(false);
    const [name, setName] = useState('');
    const [pluralName, setPluralName] = useState('');
    const [isCountable, setIsCountable] = useState(false);
    const [density, setDensity] = useState('');
    const toast = useToast();
    const [isFocused, setIsFocused] = useState(false);

    const [saveIngredient] = useMutation(mutation, {
        onCompleted: handleComplete,
        onError: (error) => {
            setHasError(true);
            toast({
                title: 'Error saving ingredient',
                description: formatError(error),
                status: 'error',
                position: 'top',
                duration: 3000,
            });
        },
        refetchQueries: ['GetIngredients'],
    });

    useEffect(() => {
        if (initData) {
            setName(initData.name);
            setPluralName(initData.pluralName);
            setIsCountable(initData.isCountable);
            setDensity(initData.density ? initData.density.toString() : '');
        }
        if (disabled) {
            setHasError(false);
            setName('');
            setPluralName('');
            setIsCountable(false);
            setDensity('');
        }
    }, [initData, disabled]);

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
            saveIngredient({ variables: { record: { ...validated }, ...mutationVars } });
        } catch (e: unknown) {
            setHasError(true);
            if (e instanceof ValidationError) {
                toast({
                    title: 'Error saving ingredient',
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
        <Stack
            spacing={4}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...rest}
        >
            <FloatingLabelInput
                label='Name'
                id='name'
                firstFieldRef={fieldRef}
                value={name}
                isInvalid={hasError}
                isRequired
                isDisabled={disabled}
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
                isDisabled={disabled}
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
                isDisabled={disabled}
                onChange={(e) => {
                    setDensity(e.target.value);
                    hasError && setHasError(false);
                }}
            />
            <Checkbox onChange={(e) => setIsCountable(e.target.checked)} isDisabled={disabled}>
                Countable
            </Checkbox>
            <ButtonGroup display='flex' justifyContent='flex-end' isDisabled={disabled}>
                <Button colorScheme='teal' onClick={handleSubmit}>
                    Save
                </Button>
            </ButtonGroup>
        </Stack>
    );
}
