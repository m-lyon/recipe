import { useEffect, useRef } from 'react';
import ResizeTextarea from 'react-textarea-autosize';
import { Textarea, TextareaProps, useMergeRefs } from '@chakra-ui/react';

interface Props extends TextareaProps {
    defaultStr: string;
    value: string;
    handleChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    handleSubmit: () => void;
    handleEnter?: () => void;
    optionalRef?: React.RefObject<HTMLTextAreaElement> | null;
}
export function EditableItemArea(props: Props) {
    const { defaultStr, value, handleChange, handleSubmit, handleEnter, optionalRef, ...rest } =
        props;
    const ref = useRef<HTMLTextAreaElement | null>(null);
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

        if (ref.current) {
            ref.current.addEventListener('keydown', onEnter);
        }

        return () => {
            if (ref.current) {
                ref.current.removeEventListener('keydown', onEnter);
            }
        };
    }, []);

    return (
        <Textarea
            ref={refs}
            value={value}
            placeholder={defaultStr}
            onChange={handleChange}
            onBlur={handleSubmit}
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
