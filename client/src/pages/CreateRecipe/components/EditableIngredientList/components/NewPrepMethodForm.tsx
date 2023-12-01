import { Button, ButtonGroup, Stack } from '@chakra-ui/react';
import { TextInput } from '../../../../../components/TextInput';

interface FormProps {
    firstFieldRef: React.MutableRefObject<HTMLInputElement | null>;
}
export function NewPrepMethodForm({ firstFieldRef }: FormProps) {
    return (
        <Stack spacing={4}>
            <TextInput label='Name' id='name' ref={firstFieldRef} />
            <ButtonGroup display='flex' justifyContent='flex-end'>
                <Button colorScheme='teal'>Save</Button>
            </ButtonGroup>
        </Stack>
    );
}
