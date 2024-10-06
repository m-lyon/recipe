import { ValidationError } from 'yup';
import { useMutation } from '@apollo/client';
import { MutableRefObject, useEffect, useState } from 'react';
import { FormControl, FormHelperText } from '@chakra-ui/react';
import { Button, ButtonGroup, HStack } from '@chakra-ui/react';
import { Checkbox, Radio, RadioGroup, Stack, StackProps } from '@chakra-ui/react';

import { useErrorToast } from '@recipe/common/hooks';
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
    const [preferredNumberFormat, setpreferredNumberFormat] = useState('');
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
            spacing={4}
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
                isInvalid={hasError}
                isRequired
                onChange={(e) => {
                    setValue(e.target.value.toLowerCase());
                    hasError && setHasError(false);
                }}
            />
            <FormControl isInvalid={hasError}>
                <FormHelperText>Preferred number format</FormHelperText>
                <RadioGroup onChange={setpreferredNumberFormat} value={preferredNumberFormat}>
                    <HStack spacing='12px'>
                        <Radio value='decimal'>decimal</Radio>
                        <Radio value='fraction'>fraction</Radio>
                    </HStack>
                </RadioGroup>
            </FormControl>
            <Checkbox
                isInvalid={hasError}
                onChange={(e) => setHasSpace(e.target.checked)}
                isChecked={hasSpace}
            >
                Space after quantity
            </Checkbox>
            <ButtonGroup display='flex' justifyContent='flex-end' paddingTop={2}>
                <Button colorScheme='teal' onClick={handleSubmit} aria-label='Save unit'>
                    Save
                </Button>
            </ButtonGroup>
        </Stack>
    );
}
