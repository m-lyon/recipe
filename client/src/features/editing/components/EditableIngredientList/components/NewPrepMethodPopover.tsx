import { object, string, ValidationError } from 'yup';
import { useState, useContext, useEffect } from 'react';
import { useMutation, ApolloError } from '@apollo/client';
import { Button, ButtonGroup, useToast } from '@chakra-ui/react';
import { PopoverHeader, PopoverArrow, Stack } from '@chakra-ui/react';
import { PopoverCloseButton, PopoverContent } from '@chakra-ui/react';

import { User } from '../../../../../__generated__/graphql';
import { UserContext } from '../../../../../context/UserContext';
import { FloatingLabelInput } from '../../../../../components/FloatingLabelInput';
import { PrepMethodSuggestion } from './PrepMethodDropdownList';
import { CREATE_PREP_METHOD } from '../../../../../graphql/mutations/prepMethod';



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
function NewPrepMethodForm({ firstFieldRef, onClose, handleSelect }: NewPrepMethodFormProps) {
    const [userContext] = useContext(UserContext);
    const toast = useToast();
    const [hasError, setHasError] = useState(false);
    const [value, setValue] = useState('');

    const [createNewPrepMethod] = useMutation(CREATE_PREP_METHOD, {
        onCompleted: (data) => {
            onClose();
            handleSelect({
                value: data!.prepMethodCreateOne!.record!.value,
                colour: undefined,
                _id: data?.prepMethodCreateOne?.record?._id,
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
            const user = userContext as User;
            createNewPrepMethod({
                variables: {
                    record: {
                        ...validated,
                        owner: user._id,
                    },
                },
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
            if (e.key === 'Enter') {
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
        <Stack spacing={4}>
            <FloatingLabelInput
                label='Name'
                id='name'
                firstFieldRef={firstFieldRef}
                value={value}
                isInvalid={hasError}
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
