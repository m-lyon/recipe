import { useRef } from 'react';
import { Input, InputProps, useMergeRefs } from '@chakra-ui/react';

interface Props extends InputProps {
    onSubmit: () => void;
    optionalRef?: React.RefObject<HTMLInputElement> | null;
    placeholderColor?: string;
}
export function EditableText(props: Props) {
    const { optionalRef, onSubmit, placeholderColor, ...rest } = props;
    const ref = useRef<HTMLInputElement>(null);
    const refs = useMergeRefs(ref, optionalRef);

    return (
        <Input
            ref={refs}
            onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    ref.current?.blur();
                }
            }}
            onBlur={onSubmit}
            minH='unset'
            border='none'
            px={0}
            pt={0}
            _focusVisible={{ outline: 'none' }}
            sx={placeholderColor ? { '&::placeholder': { color: placeholderColor } } : undefined}
            {...rest}
        />
    );
}
