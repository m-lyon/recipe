import { Button, ButtonGroup, Stack } from '@chakra-ui/react';
import { TextInput } from '../../../../../components/TextInput';

interface FormProps {
    firstFieldRef: React.MutableRefObject<HTMLInputElement | null>;
}
export function NewUnitForm({ firstFieldRef }: FormProps) {
    return (
        <Stack spacing={4}>
            <TextInput label='Short singular name' id='short-singular-name' ref={firstFieldRef} />
            <TextInput label='Short plural name' id='short-plural-name' />
            <TextInput label='Long singular name' id='long-singular-name' />
            <TextInput label='Long plural name' id='long-plural-name' />
            <ButtonGroup display='flex' justifyContent='flex-end'>
                <Button colorScheme='teal'>Save</Button>
            </ButtonGroup>
        </Stack>
    );
}
