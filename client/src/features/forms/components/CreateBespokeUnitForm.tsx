import { ValidationError } from 'yup';
import { Field } from '@chakra-ui/react';
import { useMutation } from '@apollo/client';
import { MutableRefObject, useEffect, useState } from 'react';
import { Button, ButtonGroup, HStack } from '@chakra-ui/react';
import { RadioGroup, Stack, StackProps } from '@chakra-ui/react';

import { useErrorToast } from '@recipe/common/hooks';
import { Checkbox, Radio } from '@recipe/common/components';
import { CREATE_UNIT } from '@recipe/graphql/mutations/unit';
import { FloatingLabelInput } from '@recipe/common/components';
import { CreateUnitMutation } from '@recipe/graphql/generated';

import { unitFormSchema } from './BaseUnitForm';

interface Props extends StackProps {
    fieldRef: MutableRefObject<HTMLInputElement | null>;
    value: string;
    setValue: (value: string) => void;
    handleComplete: (data: CreateUnitMutation) => void;
}
export function CreateBespokeUnitForm(props: Props) {
    const { fieldRef, value, setValue, handleComplete, ...rest } = props;
    const toast = useErrorToast();
    const [hasError, setHasError] = useState(false);
    const [preferredNumberFormat, setpreferredNumberFormat] = useState<null | string>(null);
    const [hasSpace, setHasSpace] = useState(true);
    const [isFocused, setIsFocused] = useState(false);

    const [saveUnit] = useMutation(CREATE_UNIT, {
        onCompleted: handleComplete,
        onError: (error) => {
            toast({
                title: 'Error saving unit',
                description: error.message,
                position: 'top',
            });
            setHasError(true);
        },
    });

    const handleSubmit = () => {
        try {
            const validated = unitFormSchema.validateSync({
                shortSingular: value,
                shortPlural: value,
                longSingular: value,
                longPlural: value,
                preferredNumberFormat,
                hasSpace,
                unique: false,
            });
            saveUnit({ variables: { record: validated } });
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
            gap={4}
            pt={3}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...rest}
        >
            <FloatingLabelInput
                id='name'
                label='Unit name'
                inputRef={fieldRef}
                value={value}
                invalid={hasError}
                required
                onChange={(e) => {
                    setValue(e.target.value.toLowerCase());
                    hasError && setHasError(false);
                }}
            />
            <Field.Root invalid={hasError}>
                <Field.HelperText>Preferred number format</Field.HelperText>
                <RadioGroup.Root
                    onValueChange={(e) => setpreferredNumberFormat(e.value)}
                    value={preferredNumberFormat}
                >
                    <HStack gap='12px'>
                        <Radio value='decimal'>decimal</Radio>
                        <Radio value='fraction'>fraction</Radio>
                    </HStack>
                </RadioGroup.Root>
            </Field.Root>
            <Checkbox
                invalid={hasError}
                onCheckedChange={(e) => setHasSpace(!!e.checked)}
                checked={hasSpace}
            >
                Space after quantity
            </Checkbox>
            <ButtonGroup display='flex' justifyContent='flex-end' paddingTop={2}>
                <Button colorPalette='teal' onClick={handleSubmit} aria-label='Save unit'>
                    Save
                </Button>
            </ButtonGroup>
        </Stack>
    );
}
