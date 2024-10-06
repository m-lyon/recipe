import { ApolloError } from '@apollo/client';
import { HStack, Stack, StackProps } from '@chakra-ui/react';
import { Button, ButtonGroup, Checkbox } from '@chakra-ui/react';
import { MutableRefObject, useCallback, useEffect, useState } from 'react';
import { ValidationError, array, boolean, mixed, number, object, string } from 'yup';

import { useErrorToast } from '@recipe/common/hooks';
import { FloatingLabelInput } from '@recipe/common/components';

export function formatIngredientError(error: ApolloError) {
    if (error.message.startsWith('E11000')) {
        return 'Ingredient already exists';
    }
    return error.message;
}
const reservedTags: ReservedTags[] = ['vegan', 'vegetarian'];

export type IngredientFormData = ReturnType<typeof formSchema.validateSync>;
export interface BaseIngredientFormProps extends StackProps {
    fieldRef?: MutableRefObject<HTMLInputElement | null>;
    initData?: ModifyableIngredient;
    disabled?: boolean;
    handleSubmit: (data: IngredientFormData) => void;
    handleDelete?: () => void;
}
const formSchema = object({
    name: string().required('Name is required'),
    pluralName: string().required(),
    isCountable: boolean().required(),
    density: number(),
    tags: array()
        .required()
        .of(mixed<ReservedTags>().required().oneOf(reservedTags, 'Invalid tag')),
});

export function BaseIngredientForm(props: BaseIngredientFormProps) {
    const { fieldRef, initData, disabled, handleSubmit, handleDelete, ...rest } = props;
    const toast = useErrorToast();
    const [hasError, setHasError] = useState(false);
    const [name, setName] = useState('');
    const [pluralName, setPluralName] = useState('');
    const [isCountable, setIsCountable] = useState(false);
    const [density, setDensity] = useState('');
    const [vegan, setVegan] = useState(false);
    const [vegetarian, setVegetarian] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
        if (initData) {
            setName(initData.name);
            setPluralName(initData.pluralName);
            setIsCountable(initData.isCountable);
            setDensity(initData.density ? initData.density.toString() : '');
            setVegan(initData.tags.includes('vegan'));
            setVegetarian(initData.tags.includes('vegetarian'));
        }
        if (disabled) {
            setHasError(false);
            setName('');
            setPluralName('');
            setIsCountable(false);
            setDensity('');
            setVegan(false);
            setVegetarian(false);
        }
    }, [initData, disabled]);

    const onSubmit = useCallback(() => {
        try {
            const validated = formSchema.validateSync({
                name,
                pluralName: pluralName === '' ? name : pluralName,
                isCountable,
                density: density === '' ? undefined : parseFloat(density),
                tags: (vegan ? ['vegan'] : []).concat(vegetarian ? ['vegetarian'] : []),
            });
            handleSubmit(validated);
        } catch (e: unknown) {
            setHasError(true);
            if (e instanceof ValidationError) {
                toast({
                    title: 'Error saving ingredient',
                    description: e.message,
                    position: 'top',
                });
            }
        }
    }, [name, pluralName, isCountable, density, vegan, vegetarian, handleSubmit, toast]);

    useEffect(() => {
        const handleKeyboardEvent = (e: KeyboardEvent) => {
            if (isFocused && e.key === 'Enter') {
                e.preventDefault();
                onSubmit();
            }
        };
        window.addEventListener('keydown', handleKeyboardEvent);

        return () => {
            window.removeEventListener('keydown', handleKeyboardEvent);
        };
    }, [isFocused, onSubmit]);

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
                inputRef={fieldRef}
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
                value={density}
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
            <HStack>
                <Checkbox
                    isDisabled={disabled}
                    pr={6}
                    isChecked={vegan}
                    onChange={(e) => {
                        if (e.target.checked) {
                            setVegetarian(true);
                            setVegan(true);
                        } else {
                            setVegan(false);
                        }
                    }}
                >
                    Vegan
                </Checkbox>
                <Checkbox
                    isChecked={vegetarian}
                    isDisabled={disabled}
                    onChange={(e) => {
                        if (e.target.checked) {
                            setVegetarian(true);
                        } else {
                            setVegetarian(false);
                            setVegan(false);
                        }
                    }}
                >
                    Vegetarian
                </Checkbox>
            </HStack>
            <ButtonGroup display='flex' justifyContent='flex-end' isDisabled={disabled}>
                {handleDelete && (
                    <Button colorScheme='red' onClick={handleDelete} aria-label='Delete ingredient'>
                        Delete
                    </Button>
                )}
                <Button colorScheme='teal' onClick={onSubmit} aria-label='Save ingredient'>
                    Save
                </Button>
            </ButtonGroup>
        </Stack>
    );
}
