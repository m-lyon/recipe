import { FormControl, FormLabel, Input } from '@chakra-ui/react';
import { forwardRef } from 'react';

interface TextInputProps {
    label: string;
    id: string;
    defaultValue?: string;
}
export const TextInput = forwardRef<HTMLInputElement, TextInputProps>((props, ref) => {
    return (
        <FormControl>
            <FormLabel htmlFor={props.id}>{props.label}</FormLabel>
            <Input ref={ref} {...props} />
        </FormControl>
    );
});
