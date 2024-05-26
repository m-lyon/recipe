import { useEffect, useState } from 'react';
import { ValidationError, object, string } from 'yup';
import { ApolloError, useMutation } from '@apollo/client';
import { Button, ButtonGroup, useToast } from '@chakra-ui/react';
import { PopoverArrow, PopoverHeader, Stack } from '@chakra-ui/react';
import { PopoverCloseButton, PopoverContent } from '@chakra-ui/react';

import { FloatingLabelInput } from '@recipe/common/components';
import { CREATE_PREP_METHOD } from '@recipe/graphql/mutations/prepMethod';

import { PrepMethodSuggestion } from './PrepMethodDropdown';

function formatError(error: ApolloError) {
    if (error.message.startsWith('E11000')) {
        return 'Prep method already exists';
    }
    return error.message;
}
interface NewPrepMethodFormProps {
    firstFieldRef: React.MutableRefObject<HTMLInputElement | null>;
    onClose: () => void;
    handleSelect: (item: PrepMethodSuggestion) => void;
}
function NewPrepMethodForm(props: NewPrepMethodFormProps) {
    const { firstFieldRef, onClose, handleSelect } = props;
    const toast = useToast();
    const [hasError, setHasError] = useState(false);
    const [value, setValue] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [createNewPrepMethod] = useMutation(CREATE_PREP_METHOD, {
        onCompleted: (data) => {
            onClose();
            handleSelect({
                value: data!.prepMethodCreateOne!.record!,
                colour: undefined,
            });
            toast({
                title: 'Prep method created',
                description: `Prep method ${data?.prepMethodCreateOne?.record?.value} created`,
                status: 'success',
                position: 'top',
                duration: 3000,
            });
        },
        onError: (error) => {
            toast({
                title: 'Error creating new prep method',
                description: formatError(error),
                status: 'error',
                position: 'top',
                duration: 3000,
            });
        },
        refetchQueries: ['GetPrepMethods'],
    });

    const formSchema = object({ value: string().required('Prep method is required') });

    const handleSubmit = () => {
        try {
            const validated = formSchema.validateSync({ value });
            createNewPrepMethod({
                variables: { record: validated },
            });
        } catch (e: unknown) {
            if (e instanceof ValidationError) {
                setHasError(true);
                toast({
                    title: 'Error creating new prep method',
                    description: e.message,
                    status: 'error',
                    position: 'top',
                    duration: 3000,
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
        <Stack spacing={4} onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)}>
            <FloatingLabelInput
                label='Name'
                id='name'
                firstFieldRef={firstFieldRef}
                value={value}
                isInvalid={hasError}
                isRequired
                onChange={(e) => {
                    setValue(e.target.value.toLowerCase());
                    hasError && setHasError(false);
                }}
            />
            <ButtonGroup display='flex' justifyContent='flex-end'>
                <Button colorScheme='teal' onClick={handleSubmit}>
                    Save
                </Button>
            </ButtonGroup>
        </Stack>
    );
}

export function NewPrepMethodPopover(props: NewPrepMethodFormProps) {
    return (
        <PopoverContent paddingRight={4} paddingBottom={3} paddingLeft={2}>
            <PopoverArrow />
            <PopoverCloseButton />
            <PopoverHeader border='hidden'>Add new prep method</PopoverHeader>
            <NewPrepMethodForm {...props} />
        </PopoverContent>
    );
}
