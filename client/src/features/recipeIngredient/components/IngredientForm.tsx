import { useEffect, useState } from 'react';
import { Button, ButtonGroup, Checkbox } from '@chakra-ui/react';
import { ApolloError, Reference, useMutation } from '@apollo/client';
import { HStack, Stack, StackProps, useToast } from '@chakra-ui/react';
import { ValidationError, array, boolean, mixed, number, object, string } from 'yup';

import { DELAY_LONG } from '@recipe/constants';
import { FloatingLabelInput } from '@recipe/common/components';
import { Ingredient, Scalars } from '@recipe/graphql/generated';
import { DELETE_INGREDIENT } from '@recipe/graphql/mutations/ingredient';
import { INGREDIENT_FIELDS_FULL } from '@recipe/graphql/queries/ingredient';
import { EnumIngredientCreateTags, EnumIngredientTags } from '@recipe/graphql/generated';
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
    handleDelete?: never;
}
interface ModifyIngredientFormProps extends CommonIngredientFormProps {
    mutation: typeof MODIFY_INGREDIENT;
    mutationVars?: { id: Scalars['MongoID']['input'] };
    handleComplete: (data: ModifyIngredientMutation) => void;
    handleDelete: () => void;
}
type IngredientFormProps = CreateIngredientFormProps | ModifyIngredientFormProps;
export function IngredientForm(props: IngredientFormProps) {
    const {
        fieldRef,
        mutation,
        mutationVars,
        handleComplete,
        handleDelete,
        initData,
        disabled,
        ...rest
    } = props;
    const [hasError, setHasError] = useState(false);
    const [name, setName] = useState('');
    const [pluralName, setPluralName] = useState('');
    const [isCountable, setIsCountable] = useState(false);
    const [density, setDensity] = useState('');
    const [vegan, setVegan] = useState(false);
    const [vegetarian, setVegetarian] = useState(false);
    const toast = useToast();
    const [isFocused, setIsFocused] = useState(false);
    const [deleteIngredient] = useMutation(DELETE_INGREDIENT, {
        onCompleted: handleDelete,
        onError: (error) => {
            setHasError(true);
            toast({
                title: 'Error deleting ingredient',
                description: formatError(error),
                status: 'error',
                position: 'top',
                duration: DELAY_LONG,
            });
        },
        update: (cache, { data }) => {
            cache.evict({ id: `Ingredient:${data?.ingredientRemoveById?.recordId}` });
        },
    });
    const [saveIngredient] = useMutation(mutation, {
        onCompleted: handleComplete,
        onError: (error) => {
            setHasError(true);
            toast({
                title: 'Error saving ingredient',
                description: formatError(error),
                status: 'error',
                position: 'top',
                duration: DELAY_LONG,
            });
        },
        update: (cache, { data }) => {
            cache.modify({
                fields: {
                    ingredientMany(existingRefs = [], { readField }) {
                        const record =
                            (data as CreateIngredientMutation).ingredientCreateOne?.record ??
                            (data as ModifyIngredientMutation).ingredientUpdateById?.record;
                        if (!record) {
                            return existingRefs;
                        }
                        const newRef = cache.writeFragment({
                            data: record,
                            fragment: INGREDIENT_FIELDS_FULL,
                            fragmentName: 'IngredientFieldsFull',
                        });
                        if (
                            existingRefs.some(
                                (ref: Reference) => readField('_id', ref) === record._id
                            )
                        ) {
                            return existingRefs;
                        }
                        return [...existingRefs, newRef];
                    },
                },
            });
        },
    });

    useEffect(() => {
        if (initData) {
            setName(initData.name);
            setPluralName(initData.pluralName);
            setIsCountable(initData.isCountable);
            setDensity(initData.density ? initData.density.toString() : '');
            setVegan(initData.tags.includes('vegan' as EnumIngredientTags));
            setVegetarian(initData.tags.includes('vegetarian' as EnumIngredientTags));
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

    const formSchema = object({
        name: string().required('Name is required'),
        pluralName: string().required(),
        isCountable: boolean().required(),
        density: number(),
        tags: array()
            .required()
            .of(
                mixed<EnumIngredientCreateTags>()
                    .required()
                    .oneOf(Object.values(EnumIngredientCreateTags), 'Invalid tag')
            ),
    });

    const handleSubmit = () => {
        try {
            const validated = formSchema.validateSync({
                name,
                pluralName: pluralName === '' ? name : pluralName,
                isCountable,
                density: density === '' ? undefined : density,
                tags: (vegan ? ['vegan'] : []).concat(vegetarian ? ['vegetarian'] : []),
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
                    duration: DELAY_LONG,
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
                {mutationVars && (
                    <Button
                        colorScheme='red'
                        onClick={() => deleteIngredient({ variables: mutationVars })}
                        aria-label='Delete ingredient'
                    >
                        Delete
                    </Button>
                )}
                <Button colorScheme='teal' onClick={handleSubmit} aria-label='Save ingredient'>
                    Save
                </Button>
            </ButtonGroup>
        </Stack>
    );
}
