import { ApolloError } from '@apollo/client';
import { MutableRefObject, useCallback, useEffect } from 'react';
import { array, boolean, mixed, number, object, string } from 'yup';
import { Button, ButtonGroup, Checkbox, HStack, Stack, StackProps } from '@chakra-ui/react';

import { IngredientTags } from '@recipe/graphql/enums';
import { FloatingLabelInput } from '@recipe/common/components';

import { useFormLogic } from '../hooks/useFormLogic';
import { useKeyboardSubmit } from '../hooks/useKeyboardSubmit';

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
        .of(mixed<IngredientTags>().required().oneOf(Object.values(IngredientTags), 'Invalid tag')),
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
    const xfm = useCallback(
        (data: Partial<ModifyableIngredient>) => ({
            name: data.name,
            pluralName: data.pluralName || data.name,
            tags: data.tags || [],
            density: data.density || undefined,
            isCountable: data.isCountable || false,
        }),
        []
    );
    const { formData, hasError, handleSubmit, handleChange, setData } =
        useFormLogic<ModifyableIngredient>(
            formSchema,
            xfm,
            initData || {},
            submitForm,
            'ingredient'
        );
    const { setIsFocused } = useKeyboardSubmit(handleSubmit);
    useEffect(() => {
        if (disabled) {
            setData({ name: '', pluralName: '', isCountable: false, tags: [] });
        }
    }, [disabled, setData]);

    return (
        <Stack
            gap={4}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...rest}
        >
            <FloatingLabelInput
                label='Name'
                id='name'
                inputRef={fieldRef}
                value={formData.name || ''}
                invalid={hasError}
                isRequired
                disabled={disabled}
                onChange={(e) => handleChange('name', e.target.value.toLowerCase())}
            />
            <FloatingLabelInput
                label='Plural name'
                id='plural-name'
                value={formData.pluralName || ''}
                invalid={hasError}
                disabled={disabled}
                onChange={(e) => handleChange('pluralName', e.target.value.toLowerCase())}
            />
            <FloatingLabelInput
                label='Density (g/ml)'
                id='density'
                value={formData.density?.toString() || ''}
                invalid={hasError}
                disabled={disabled}
                onChange={(e) => handleChange('density', parseFloat(e.target.value) || undefined)}
            />
            <Checkbox
                isChecked={formData.isCountable}
                onChange={(e) => handleChange('isCountable', e.target.checked)}
                disabled={disabled}
            >
                Countable
            </Checkbox>
            <HStack>
                <Checkbox
                    disabled={disabled}
                    pr={6}
                    isChecked={formData.tags?.includes(IngredientTags.Vegan)}
                    onChange={(e) => {
                        const newTags = e.target.checked
                            ? Object.values(IngredientTags)
                            : formData.tags?.filter((tag) => tag !== IngredientTags.Vegan) || [];
                        handleChange('tags', [...new Set(newTags)]);
                    }}
                >
                    Vegan
                </Checkbox>
                <Checkbox
                    isChecked={formData.tags?.includes(IngredientTags.Vegetarian)}
                    disabled={disabled}
                    onChange={(e) => {
                        const newTags = e.target.checked
                            ? [...(formData.tags || []), IngredientTags.Vegetarian]
                            : [];
                        handleChange('tags', newTags);
                    }}
                >
                    Vegetarian
                </Checkbox>
            </HStack>
            <ButtonGroup display='flex' justifyContent='flex-end' disabled={disabled}>
                {onDelete && (
                    <Button colorPalette='red' onClick={onDelete} aria-label='Delete ingredient'>
                        Delete
                    </Button>
                )}
                <Button colorPalette='teal' onClick={handleSubmit} aria-label='Save ingredient'>
                    Save
                </Button>
            </ButtonGroup>
        </Stack>
    );
}
