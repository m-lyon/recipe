import { StackProps } from '@chakra-ui/react';
import { Stack, Text } from '@chakra-ui/react';
import { ApolloError, useQuery } from '@apollo/client';
import { boolean, mixed, number, object, string } from 'yup';
import { MutableRefObject, useCallback, useEffect } from 'react';
import { Button, ButtonGroup, Checkbox } from '@chakra-ui/react';
import { FormControl, FormHelperText, HStack, Radio, RadioGroup } from '@chakra-ui/react';

import { useUser } from '@recipe/features/user';
import { NumberFormat } from '@recipe/graphql/enums';
import { GET_INGREDIENT_COMPONENTS } from '@recipe/graphql/queries/recipe';
import { EnumUnitDimension, EnumUnitSystem } from '@recipe/graphql/generated';
import { FloatingLabelInput, SearchableSelect } from '@recipe/common/components';

import { useFormLogic } from '../hooks/useFormLogic';
import { useKeyboardSubmit } from '../hooks/useKeyboardSubmit';

export function formatUnitError(error: ApolloError) {
    if (error.message.startsWith('E11000')) {
        return 'Unit already exists';
    }
    return error.message;
}

const DIMENSION_OPTIONS = [
    { value: 'mass', label: 'Mass' },
    { value: 'volume', label: 'Volume' },
    { value: 'count', label: 'Count' },
];
const CANONICAL_NAME: Record<EnumUnitDimension, string> = {
    mass: 'Grams',
    volume: 'Millilitres',
    count: '',
};
const CANONICAL_SYMBOL: Record<EnumUnitDimension, string> = { mass: 'g', volume: 'ml', count: '' };
const SYSTEM_NAME: Partial<Record<EnumUnitSystem, string>> = { metric: 'metric', us: 'US' };

/** The size of a unit the reader cannot change, as a sentence. */
function describeSize(data: Partial<ModifyableUnit>, isStandard: boolean): string {
    const { dimension = 'count', perCanonical, system } = data;
    if (isStandard) {
        const size =
            dimension === 'count' || !perCanonical
                ? 'a count'
                : `1 ${data.longSingular} = ${Number(perCanonical.toPrecision(5))} ${CANONICAL_SYMBOL[dimension]}${system ? ` (${SYSTEM_NAME[system]})` : ''}`;
        return `Standard unit: ${size}.`;
    }
    if (dimension === 'count') {
        return '';
    }
    return `1 ${data.longSingular} = ${perCanonical} ${CANONICAL_SYMBOL[dimension]}.`;
}

export const unitFormSchema = object({
    shortSingular: string().required('Short singular name is required'),
    shortPlural: string().required('Short plural name is required'),
    longSingular: string().required('Long singular name is required'),
    longPlural: string().required('Long plural name is required'),
    preferredNumberFormat: mixed<NumberFormat>()
        .required()
        .oneOf(Object.values(NumberFormat), 'You must select a number format'),
    hasSpace: boolean().required(),
    unique: boolean().required(),
    dimension: mixed<EnumUnitDimension>()
        .required('You must select a dimension')
        .oneOf(['mass', 'volume', 'count'], 'You must select a dimension'),
    perCanonical: number().required('Size is required').moreThan(0, 'Size must be greater than 0'),
    system: mixed<EnumUnitSystem>()
        .nullable()
        .when('dimension', {
            is: 'count',
            then: (schema) => schema.oneOf([null]),
            otherwise: (schema) =>
                schema.required('You must select a system').oneOf(['metric', 'us']),
        }),
});
export interface BaseUnitFormProps extends StackProps {
    fieldRef?: MutableRefObject<HTMLInputElement | null>;
    initData?: Partial<ModifyableUnit>;
    disabled?: boolean;
    submitForm: (data: ModifyableUnit) => void;
    onDelete?: () => void;
}
export function BaseUnitForm(props: BaseUnitFormProps) {
    const { fieldRef, initData, disabled, submitForm, onDelete, ...rest } = props;
    const { isAdmin } = useUser();
    // Code owns the size of a standard unit, and only an admin sizes a mass or volume unit.
    const isStandard = Boolean(initData?.standard);
    const canChangeSize = isAdmin && !isStandard;
    const xfm = useCallback(
        (data: Partial<ModifyableUnit>) => ({
            shortSingular: data.shortSingular,
            shortPlural: data.shortPlural || data.shortSingular,
            longSingular: data.longSingular,
            longPlural: data.longPlural || data.longSingular,
            preferredNumberFormat: data.preferredNumberFormat,
            hasSpace: data.hasSpace,
            unique: true,
            // A new unit defaults to count: it reaches grams only through a measure, so
            // it can never be priced wrongly, only left uncounted.
            dimension: data.dimension ?? 'count',
            // A count unit never converts to another, so its size is fixed at 1.
            perCanonical: (data.dimension ?? 'count') === 'count' ? 1 : data.perCanonical,
            system: (data.dimension ?? 'count') === 'count' ? null : (data.system ?? null),
        }),
        []
    );
    const { formData, hasError, handleSubmit, handleChange, setData } =
        useFormLogic<ModifyableUnit>(unitFormSchema, xfm, initData || {}, submitForm, 'unit');
    const { setIsFocused } = useKeyboardSubmit(handleSubmit);
    const { data: components } = useQuery(GET_INGREDIENT_COMPONENTS);
    // Same size is a warning, not an error: ml and cc are both 1 ml but written differently.
    const sameSize = (components?.units ?? []).find(
        (unit) =>
            unit._id !== initData?._id &&
            formData.dimension !== 'count' &&
            unit.dimension === formData.dimension &&
            unit.perCanonical === formData.perCanonical
    );
    const sizeDescription = describeSize(formData, isStandard);

    useEffect(() => {
        if (disabled) {
            setData({
                shortSingular: '',
                shortPlural: '',
                longSingular: '',
                longPlural: '',
                hasSpace: false,
            });
        }
    }, [disabled, setData]);

    return (
        <Stack
            spacing={4}
            pt={3}
            color='blackAlpha.700'
            fontWeight='bold'
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...rest}
        >
            <FloatingLabelInput
                inputRef={fieldRef}
                id='short-singular-name'
                label='Short singular name'
                value={formData.shortSingular || ''}
                isInvalid={hasError}
                isRequired
                isDisabled={disabled}
                onChange={(e) => handleChange('shortSingular', e.target.value.toLowerCase())}
            />
            <FloatingLabelInput
                label='Short plural name'
                id='short-plural-name'
                value={formData.shortPlural || ''}
                isInvalid={hasError}
                isDisabled={disabled}
                onChange={(e) => handleChange('shortPlural', e.target.value.toLowerCase())}
            />
            <FloatingLabelInput
                label='Long singular name'
                id='long-singular-name'
                value={formData.longSingular || ''}
                isRequired
                isDisabled={disabled}
                isInvalid={hasError}
                onChange={(e) => handleChange('longSingular', e.target.value.toLowerCase())}
            />
            <FloatingLabelInput
                label='Long plural name'
                id='long-plural-name'
                value={formData.longPlural || ''}
                isDisabled={disabled}
                isInvalid={hasError}
                onChange={(e) => handleChange('longPlural', e.target.value.toLowerCase())}
            />
            <FormControl isDisabled={disabled} isInvalid={hasError}>
                <FormHelperText>Preferred number format</FormHelperText>
                <RadioGroup
                    onChange={(value) => handleChange('preferredNumberFormat', value)}
                    value={formData.preferredNumberFormat}
                >
                    <HStack spacing='12px'>
                        <Radio value='decimal'>decimal</Radio>
                        <Radio value='fraction'>fraction</Radio>
                    </HStack>
                </RadioGroup>
            </FormControl>
            <Checkbox
                isDisabled={disabled}
                isInvalid={hasError}
                onChange={(e) => handleChange('hasSpace', e.target.checked)}
                isChecked={formData.hasSpace}
            >
                Space after quantity
            </Checkbox>
            {canChangeSize ? (
                <>
                    <FormControl isDisabled={disabled} isInvalid={hasError}>
                        <SearchableSelect
                            label='Dimension'
                            aria-label='Dimension'
                            options={DIMENSION_OPTIONS}
                            value={disabled ? null : (formData.dimension ?? 'count')}
                            onChange={(val) => handleChange('dimension', val as EnumUnitDimension)}
                            disabled={disabled}
                        />
                    </FormControl>
                    {formData.dimension && formData.dimension !== 'count' && (
                        <>
                            <FloatingLabelInput
                                label={`${CANONICAL_NAME[formData.dimension]} in one unit`}
                                id='per-canonical'
                                value={formData.perCanonical?.toString() ?? ''}
                                isInvalid={hasError}
                                isRequired
                                isDisabled={disabled}
                                onChange={(e) =>
                                    handleChange(
                                        'perCanonical',
                                        parseFloat(e.target.value) || undefined
                                    )
                                }
                            />
                            {sameSize && (
                                <Text fontSize='sm' color='orange.500' fontWeight='normal'>
                                    This is the same size as {sameSize.longSingular}
                                </Text>
                            )}
                            <FormControl isDisabled={disabled} isInvalid={hasError}>
                                <FormHelperText>System</FormHelperText>
                                <RadioGroup
                                    onChange={(value) =>
                                        handleChange('system', value as EnumUnitSystem)
                                    }
                                    value={formData.system ?? ''}
                                >
                                    <HStack spacing='12px'>
                                        <Radio value='metric'>metric</Radio>
                                        <Radio value='us'>US customary</Radio>
                                    </HStack>
                                </RadioGroup>
                            </FormControl>
                        </>
                    )}
                </>
            ) : (
                !disabled &&
                sizeDescription && (
                    <Text fontSize='sm' fontWeight='normal' aria-label='Unit size'>
                        {sizeDescription}
                    </Text>
                )
            )}
            <ButtonGroup
                display='flex'
                justifyContent='flex-end'
                paddingTop={2}
                isDisabled={disabled}
            >
                {onDelete && !isStandard && (
                    <Button colorScheme='red' onClick={onDelete} aria-label='Delete unit'>
                        Delete
                    </Button>
                )}
                <Button colorScheme='teal' onClick={handleSubmit} aria-label='Save unit'>
                    Save
                </Button>
            </ButtonGroup>
        </Stack>
    );
}
