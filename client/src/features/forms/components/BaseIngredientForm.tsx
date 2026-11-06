import { ApolloError } from '@apollo/client';
import { array, boolean, mixed, object, string } from 'yup';
import { useImperativeHandle, useRef, useState } from 'react';
import { Stack, StackProps, Tooltip } from '@chakra-ui/react';
import { MutableRefObject, forwardRef, useCallback, useEffect } from 'react';
import { Box, Button, ButtonGroup, Checkbox, HStack } from '@chakra-ui/react';

import { IngredientTags } from '@recipe/graphql/enums';
import type { Owner } from '@recipe/common/components';
import { FloatingLabelInput, OwnerText } from '@recipe/common/components';

import { useFormLogic } from '../hooks/useFormLogic';
import { MeasureForDensity } from '../utils/nutrition';
import { PerGramByPrep } from './NutritionLinkSection';
import { useKeyboardSubmit } from '../hooks/useKeyboardSubmit';
import { ExistingNutritionalInfo, LinkedPortion } from './nutritionTypes';
import { MeasuresSection, MeasuresSectionHandle } from './MeasuresSection';
import { NutritionLinkSection, NutritionLinkSectionHandle } from './NutritionLinkSection';

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
    owner?: Owner | null;
    existingNutritionalInfos?: ExistingNutritionalInfo[];
    onNutritionalInfoChange?: () => void;
}
export const BaseIngredientForm = forwardRef<NutritionLinkSectionHandle, BaseIngredientFormProps>(
    function BaseIngredientForm(props, ref) {
        const {
            fieldRef,
            initData,
            ingredientId,
            disabled,
            submitForm,
            onDelete,
            owner,
            existingNutritionalInfos,
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
        const nutritionRef = useRef<NutritionLinkSectionHandle>(null);
        const measuresRef = useRef<MeasuresSectionHandle>(null);
        const [portions, setPortions] = useState<LinkedPortion[]>([]);
        const [perGram, setPerGram] = useState<PerGramByPrep | null>(null);
        const [measures, setMeasures] = useState<MeasureForDensity[]>([]);
        // The nutrition link and measures are staged, and saved once the ingredient is.
        useImperativeHandle(ref, () => ({
            commitChanges: async (savedIngredientId: string) => {
                // Read both handles first: the form may unmount while the link is saved.
                const nutrition = nutritionRef.current;
                const measureList = measuresRef.current;
                await nutrition?.commitChanges(savedIngredientId);
                await measureList?.commitChanges(savedIngredientId);
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
                <Tooltip
                    label='For example, checked: "200 g mushroom", unchecked: "200 g mushrooms".'
                    hasArrow
                    openDelay={300}
                >
                    <Box alignSelf='flex-start'>
                        <Checkbox
                            isChecked={!formData.isCountable}
                            onChange={(e) => handleChange('isCountable', !e.target.checked)}
                            isDisabled={disabled}
                        >
                            Use singular form with units
                        </Checkbox>
                    </Box>
                </Tooltip>
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
                <NutritionLinkSection
                    ref={nutritionRef}
                    ingredientId={ingredientId}
                    ingredientName={initData?.name || formData.name}
                    disabled={disabled}
                    existingNutritionalInfos={existingNutritionalInfos}
                    measures={measures}
                    onNutritionalInfoChange={onNutritionalInfoChange}
                    onPortionsChange={setPortions}
                    onPerGramChange={setPerGram}
                />
                <MeasuresSection
                    ref={measuresRef}
                    ingredientId={ingredientId}
                    portions={portions}
                    perGram={perGram}
                    itemNames={[formData.name, formData.pluralName].filter((n): n is string =>
                        Boolean(n)
                    )}
                    disabled={disabled}
                    onMeasuresChange={setMeasures}
                />
                <ButtonGroup display='flex' justifyContent='flex-end' isDisabled={disabled}>
                    <OwnerText owner={owner} />
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
