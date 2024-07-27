import { useEffect, useState } from 'react';
import { FormControl, FormHelperText } from '@chakra-ui/react';
import { Button, ButtonGroup, HStack } from '@chakra-ui/react';
import { ApolloError, Reference, useMutation } from '@apollo/client';
import { ValidationError, boolean, mixed, object, string } from 'yup';
import { Checkbox, Radio, RadioGroup, Stack, StackProps } from '@chakra-ui/react';

import { useErrorToast } from '@recipe/common/hooks';
import { FloatingLabelInput } from '@recipe/common/components';
import { UNIT_FIELDS_FULL } from '@recipe/graphql/queries/unit';
import { EnumUnitCreatePreferredNumberFormat, Unit } from '@recipe/graphql/generated';
import { CREATE_UNIT, DELETE_UNIT, MODIFY_UNIT } from '@recipe/graphql/mutations/unit';
import { CreateUnitMutation, ModifyUnitMutation, Scalars } from '@recipe/graphql/generated';

function formatError(error: ApolloError) {
    if (error.message.startsWith('E11000')) {
        return 'Unit already exists';
    }
    return error.message;
}

interface CommonUnitFormProps extends StackProps {
    fieldRef?: React.MutableRefObject<HTMLInputElement | null>;
    initData?: Unit;
    disabled?: boolean;
}
interface CreateUnitFormProps extends CommonUnitFormProps {
    mutation: typeof CREATE_UNIT;
    mutationVars?: never;
    handleComplete: (data: CreateUnitMutation) => void;
    handleDelete?: never;
}
interface ModifyUnitFormProps extends CommonUnitFormProps {
    mutation: typeof MODIFY_UNIT;
    mutationVars: { id: Scalars['MongoID']['input'] };
    handleComplete: (data: ModifyUnitMutation) => void;
    handleDelete: () => void;
}
type UnitFormProps = CreateUnitFormProps | ModifyUnitFormProps;
export function UnitForm(props: UnitFormProps) {
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
    const toast = useErrorToast();
    const [hasError, setHasError] = useState(false);
    const [shortSingular, setShortSingular] = useState('');
    const [shortPlural, setShortPlural] = useState('');
    const [longSingular, setLongSingular] = useState('');
    const [longPlural, setLongPlural] = useState('');
    const [preferredNumberFormat, setpreferredNumberFormat] = useState('');
    const [hasSpace, setHasSpace] = useState(true);
    const [isFocused, setIsFocused] = useState(false);
    const [deleteUnit] = useMutation(DELETE_UNIT, {
        onCompleted: handleDelete,
        onError: (error) => {
            toast({
                title: 'Error deleting unit',
                description: formatError(error),
                position: 'top',
            });
        },
        update: (cache, { data }) => {
            cache.evict({ id: `Unit:${data?.unitRemoveById?.recordId}` });
        },
    });
    const [saveUnit] = useMutation(mutation, {
        onCompleted: handleComplete,
        onError: (error) => {
            toast({
                title: 'Error saving unit',
                description: formatError(error),
                position: 'top',
            });
            setHasError(true);
        },
        update: (cache, { data }) => {
            cache.modify({
                fields: {
                    unitMany(existingRefs = [], { readField }) {
                        const record =
                            (data as CreateUnitMutation).unitCreateOne?.record ??
                            (data as ModifyUnitMutation).unitUpdateById?.record;
                        if (!record) {
                            return existingRefs;
                        }
                        const newRef = cache.writeFragment({
                            data: record,
                            fragment: UNIT_FIELDS_FULL,
                            fragmentName: 'UnitFieldsFull',
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
            setShortSingular(initData.shortSingular);
            setShortPlural(initData.shortPlural);
            setLongSingular(initData.longSingular);
            setLongPlural(initData.longPlural);
            setpreferredNumberFormat(initData.preferredNumberFormat);
            setHasSpace(initData.hasSpace);
        }
        if (disabled) {
            setHasError(false);
            setShortSingular('');
            setShortPlural('');
            setLongSingular('');
            setLongPlural('');
            setpreferredNumberFormat('');
            setHasSpace(false);
        }
    }, [initData, disabled]);

    const formSchema = object({
        shortSingular: string().required('Short singular name is required'),
        shortPlural: string().required('Short plural name is required'),
        longSingular: string().required('Long singular name is required'),
        longPlural: string().required('Long plural name is required'),
        preferredNumberFormat: mixed<EnumUnitCreatePreferredNumberFormat>()
            .required()
            .oneOf(
                Object.values(EnumUnitCreatePreferredNumberFormat),
                'You must select a number format'
            ),
        hasSpace: boolean().required(),
    });

    const handleSubmit = () => {
        try {
            const validated = formSchema.validateSync({
                shortSingular,
                shortPlural: shortPlural === '' ? shortSingular : shortPlural,
                longSingular,
                longPlural: longPlural === '' ? longSingular : longPlural,
                preferredNumberFormat,
                hasSpace,
            });
            saveUnit({ variables: { record: validated, ...mutationVars } });
        } catch (e: unknown) {
            setHasError(true);
            if (e instanceof ValidationError) {
                toast({
                    title: 'Error saving unit',
                    description: e.message,
                    position: 'top',
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
            pt={3}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...rest}
        >
            <FloatingLabelInput
                firstFieldRef={fieldRef}
                id='short-singular-name'
                label='Short singular name'
                value={shortSingular}
                isInvalid={hasError}
                isRequired
                isDisabled={disabled}
                onChange={(e) => {
                    setShortSingular(e.target.value.toLowerCase());
                    hasError && setHasError(false);
                }}
            />
            <FloatingLabelInput
                label='Short plural name'
                id='short-plural-name'
                value={shortPlural}
                isInvalid={hasError}
                isDisabled={disabled}
                onChange={(e) => {
                    setShortPlural(e.target.value.toLowerCase());
                    hasError && setHasError(false);
                }}
            />
            <FloatingLabelInput
                label='Long singular name'
                id='long-singular-name'
                value={longSingular}
                isRequired
                isDisabled={disabled}
                isInvalid={hasError}
                onChange={(e) => {
                    setLongSingular(e.target.value.toLowerCase());
                    hasError && setHasError(false);
                }}
            />
            <FloatingLabelInput
                label='Long plural name'
                id='long-plural-name'
                value={longPlural}
                isDisabled={disabled}
                isInvalid={hasError}
                onChange={(e) => {
                    setLongPlural(e.target.value.toLowerCase());
                    hasError && setHasError(false);
                }}
            />
            <FormControl isDisabled={disabled} isInvalid={hasError}>
                <FormHelperText>Preferred number format</FormHelperText>
                <RadioGroup onChange={setpreferredNumberFormat} value={preferredNumberFormat}>
                    <HStack spacing='12px'>
                        <Radio value='decimal'>decimal</Radio>
                        <Radio value='fraction'>fraction</Radio>
                    </HStack>
                </RadioGroup>
            </FormControl>
            <Checkbox
                isDisabled={disabled}
                isInvalid={hasError}
                onChange={(e) => setHasSpace(e.target.checked)}
                isChecked={hasSpace}
            >
                Space after quantity
            </Checkbox>
            <ButtonGroup
                display='flex'
                justifyContent='flex-end'
                paddingTop={2}
                isDisabled={disabled}
            >
                {mutationVars && (
                    <Button
                        colorScheme='red'
                        onClick={() => deleteUnit({ variables: mutationVars })}
                        aria-label='Delete unit'
                    >
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
