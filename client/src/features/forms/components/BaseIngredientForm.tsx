import { ApolloError } from '@apollo/client';
import { array, boolean, mixed, object, string } from 'yup';
import { useImperativeHandle, useRef, useState } from 'react';
import { MutableRefObject, forwardRef, useCallback, useEffect } from 'react';
import { Button, ButtonGroup, Checkbox, HStack, Stack, StackProps } from '@chakra-ui/react';

import { IngredientTags } from '@recipe/graphql/enums';
import { MacroNutrients } from '@recipe/utils/nutrition';
import { FloatingLabelInput } from '@recipe/common/components';

import { useFormLogic } from '../hooks/useFormLogic';
import { UsdaLinkSectionHandle } from './UsdaLinkSection';
import { ExistingNutritionalInfo } from './UsdaLinkSection';
import { useKeyboardSubmit } from '../hooks/useKeyboardSubmit';
import { UsdaLinkSection, UsdaPortion } from './UsdaLinkSection';
import { MeasuresSection, MeasuresSectionHandle } from './MeasuresSection';

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
    tags: array()
        .required()
        .of(mixed<IngredientTags>().required().oneOf(Object.values(IngredientTags), 'Invalid tag')),
});

export interface BaseIngredientFormProps extends StackProps {
    fieldRef?: MutableRefObject<HTMLInputElement | null>;
    initData?: Partial<ModifyableIngredient>;
    ingredientId?: string;
    disabled?: boolean;
    submitForm: (data: ModifyableIngredient) => void;
    onDelete?: () => void;
    /** Nutritional info for this ingredient, prefetched by the page alongside the ingredient list. */
    existingNutritionalInfo?: ExistingNutritionalInfo | null;
    /** Called after a link is created or cleared, so the prefetched list can be refreshed. */
    onNutritionalInfoChange?: () => void;
}
export const BaseIngredientForm = forwardRef<UsdaLinkSectionHandle, BaseIngredientFormProps>(
    function BaseIngredientForm(props, ref) {
        const {
            fieldRef,
            initData,
            ingredientId,
            disabled,
            submitForm,
            onDelete,
            existingNutritionalInfo,
            onNutritionalInfoChange,
            ...rest
        } = props;
        const xfm = useCallback(
            (data: Partial<ModifyableIngredient>) => ({
                name: data.name,
                pluralName: data.pluralName || data.name,
                tags: data.tags || [],
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
        const usdaLinkRef = useRef<UsdaLinkSectionHandle>(null);
        const measuresRef = useRef<MeasuresSectionHandle>(null);
        const [portions, setPortions] = useState<UsdaPortion[]>([]);
        const [perGram, setPerGram] = useState<MacroNutrients | null>(null);
        // A new ingredient stages its nutrition link and measures until it has an id.
        useImperativeHandle(ref, () => ({
            commitPendingLink: async (newIngredientId: string) => {
                await usdaLinkRef.current?.commitPendingLink(newIngredientId);
                await measuresRef.current?.commitPendingMeasures(newIngredientId);
            },
        }));
        useEffect(() => {
            if (disabled) {
                setData({ name: '', pluralName: '', isCountable: false, tags: [] });
            }
        }, [disabled, setData]);

        return (
            <Stack
                spacing={4}
                color='blackAlpha.700'
                fontWeight='bold'
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
                <Checkbox
                    isChecked={formData.isCountable}
                    onChange={(e) => handleChange('isCountable', e.target.checked)}
                    isDisabled={disabled}
                >
                    Countable (pluralised after a unit: 200 g mushrooms)
                </Checkbox>
                <HStack mb={2}>
                    <Checkbox
                        isDisabled={disabled}
                        pr={6}
                        isChecked={formData.tags?.includes(IngredientTags.Vegan)}
                        onChange={(e) => {
                            const newTags = e.target.checked
                                ? Object.values(IngredientTags)
                                : formData.tags?.filter((tag) => tag !== IngredientTags.Vegan) ||
                                  [];
                            handleChange('tags', [...new Set(newTags)]);
                        }}
                    >
                        Vegan
                    </Checkbox>
                    <Checkbox
                        isChecked={formData.tags?.includes(IngredientTags.Vegetarian)}
                        isDisabled={disabled}
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
                <UsdaLinkSection
                    ref={usdaLinkRef}
                    ingredientId={ingredientId}
                    ingredientName={initData?.name}
                    disabled={disabled}
                    existingNutritionalInfo={existingNutritionalInfo}
                    onNutritionalInfoChange={onNutritionalInfoChange}
                    onPortionsChange={setPortions}
                    onPerGramChange={setPerGram}
                />
                <MeasuresSection
                    ref={measuresRef}
                    ingredientId={ingredientId}
                    portions={portions}
                    perGram={perGram}
                    disabled={disabled}
                />
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
);
