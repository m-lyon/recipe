import { useEffect, useRef } from 'react';
import ResizeTextarea from 'react-textarea-autosize';
import { Textarea, TextareaProps, useMergeRefs } from '@chakra-ui/react';

interface Props extends TextareaProps {
    handleChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    handleSubmit: () => void;
    handleEnter?: () => void;
    optionalRef?: React.RefObject<HTMLTextAreaElement> | null;
    placeholderColor?: string;
}
export function EditableItemArea(props: Props) {
    const { handleChange, handleSubmit, handleEnter, optionalRef, placeholderColor, ...rest } =
        props;
    const ref = useRef<HTMLTextAreaElement>(null);
    const refs = useMergeRefs(ref, optionalRef);

    useEffect(() => {
        const onEnter = (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                // Prevent default behavior of adding a new line, and instead
                // blur the text area
                e.preventDefault();
                ref.current?.blur();
                if (handleEnter) {
                    handleEnter();
                }
            }
        };
        const current = ref.current;
        if (current) {
            current.addEventListener('keydown', onEnter);
        }

        return () => {
            if (current) {
                current.removeEventListener('keydown', onEnter);
            }
        };
    }, [handleEnter]);

    return (
        <Textarea
            ref={refs}
            onChange={handleChange}
            onBlur={handleSubmit}
            sx={placeholderColor ? { '&::placeholder': { color: placeholderColor } } : undefined}
            as={ResizeTextarea}
            minRows={1}
            resize='none'
            minH='unset'
            border='none'
            px={0}
            pt={0}
            _focusVisible={{ outline: 'none' }}
            {...rest}
        />
    );
}
