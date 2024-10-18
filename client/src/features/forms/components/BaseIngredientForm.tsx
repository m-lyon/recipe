import { ApolloError } from '@apollo/client';
import { MutableRefObject, useMemo } from 'react';
import { array, boolean, mixed, number, object, string } from 'yup';
import { Button, ButtonGroup, Checkbox, HStack, Stack, StackProps } from '@chakra-ui/react';

import { FloatingLabelInput } from '@recipe/common/components';

import { useFormLogic } from '../hooks/useFormLogic';
import { useKeyboardSubmit } from '../hooks/useKeyboardSubmit';

const reservedTags: ReservedTags[] = ['vegan', 'vegetarian'];

export function formatIngredientError(error: ApolloError) {
    if (error.message.startsWith('E11000')) {
        return 'Ingredient already exists';
    }
    return error.message;
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

export interface BaseIngredientFormProps extends StackProps {
    fieldRef?: MutableRefObject<HTMLInputElement | null>;
    initData?: Partial<ModifyableIngredient>;
    disabled?: boolean;
    submitForm: (data: ModifyableIngredient) => void;
    onDelete?: () => void;
}
export function BaseIngredientForm(props: BaseIngredientFormProps) {
    const { fieldRef, initData, disabled, submitForm, onDelete, ...rest } = props;
    const disabledData = useMemo(
        () => ({ name: '', pluralName: '', isCountable: false, tags: [] }),
        []
    );
    const xfm = (data: Partial<ModifyableIngredient>) => ({
        name: data.name,
        pluralName: data.pluralName || data.name,
        tags: data.tags || [],
        density: data.density || undefined,
        isCountable: data.isCountable || false,
    });
    const { formData, hasError, handleSubmit, handleChange } = useFormLogic<ModifyableIngredient>(
        formSchema,
        xfm,
        initData,
        submitForm,
        'ingredient',
        disabled && disabledData
    );
    const { setIsFocused } = useKeyboardSubmit(handleSubmit);

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
                value={formData.name || ''}
                isInvalid={hasError}
                isRequired
                isDisabled={disabled}
                onChange={(e) => handleChange('name', e.target.value.toLowerCase())}
            />
            <FloatingLabelInput
                label='Plural name'
                id='plural-name'
                value={formData.pluralName || ''}
                isInvalid={hasError}
                isDisabled={disabled}
                onChange={(e) => handleChange('pluralName', e.target.value.toLowerCase())}
            />
            <FloatingLabelInput
                label='Density (g/ml)'
                id='density'
                value={formData.density?.toString() || ''}
                isInvalid={hasError}
                isDisabled={disabled}
                onChange={(e) => handleChange('density', parseFloat(e.target.value) || undefined)}
            />
            <Checkbox
                isChecked={formData.isCountable}
                onChange={(e) => handleChange('isCountable', e.target.checked)}
                isDisabled={disabled}
            >
                Countable
            </Checkbox>
            <HStack>
                <Checkbox
                    isDisabled={disabled}
                    pr={6}
                    isChecked={formData.tags?.includes('vegan')}
                    onChange={(e) => {
                        const newTags = e.target.checked
                            ? ['vegan', 'vegetarian']
                            : formData.tags?.filter((tag) => tag !== 'vegan') || [];
                        handleChange('tags', [...new Set(newTags)]);
                    }}
                >
                    Vegan
                </Checkbox>
                <Checkbox
                    isChecked={formData.tags?.includes('vegetarian')}
                    isDisabled={disabled}
                    onChange={(e) => {
                        const newTags = e.target.checked
                            ? [...(formData.tags || []), 'vegetarian']
                            : [];
                        handleChange('tags', newTags);
                    }}
                >
                    Vegetarian
                </Checkbox>
            </HStack>
            <ButtonGroup display='flex' justifyContent='flex-end' isDisabled={disabled}>
                {onDelete && (
                    <Button colorScheme='red' onClick={onDelete} aria-label='Delete ingredient'>
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
