import { useRef } from 'react';
import { Input, InputProps, useMergeRefs } from '@chakra-ui/react';

interface Props extends InputProps {
    optionalRef?: React.RefObject<HTMLInputElement> | null;
}
export function EditableText(props: Props) {
    const { optionalRef, ...rest } = props;
    const ref = useRef<HTMLInputElement | null>(null);
    const refs = useMergeRefs(ref, optionalRef);

    return (
        <Input
            ref={refs}
            onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    ref.current?.blur();
                }
            }}
            onBlur={rest.onSubmit}
            minH='unset'
            border='none'
            px={0}
            pt={0}
            _focusVisible={{ outline: 'none' }}
            {...rest}
        />
    );
}
