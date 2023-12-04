import { Input, InputProps } from '@chakra-ui/react';
import { forwardRef } from 'react';

export const TextInput = forwardRef<HTMLInputElement, InputProps>((props, ref) => {
    return <Input ref={ref} {...props} _focusVisible={{ outline: 'none' }} fontWeight={600} />;
});
