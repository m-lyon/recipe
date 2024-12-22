import { useRef } from 'react';
import { Box, Textarea, TextareaProps } from '@chakra-ui/react';
import ResizeTextarea from 'react-textarea-autosize';

interface Props extends TextareaProps {
    value: string;
    setValue: (value: string) => void;
    optionalRef?: React.RefObject<HTMLTextAreaElement> | null;
    placeholderColor?: string;
}
export function CentredTextArea(props: Props) {
    const { value, setValue, fontSize, fontWeight, placeholder, placeholderColor, ...rest } = props;
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const placeholderRef = useRef<HTMLSpanElement>(null);

    return (
        <Box width='100%' textAlign='center'>
            <Box
                as='span'
                ref={placeholderRef}
                position='absolute'
                fontSize={fontSize}
                fontWeight={fontWeight}
                visibility='hidden'
                whiteSpace='pre'
            >
                {placeholder}
            </Box>
            <Textarea
                ref={inputRef}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === 'Escape') {
                        inputRef.current?.blur();
                    }
                }}
                onChange={(e) => setValue(e.target.value)}
                as={ResizeTextarea}
                minH='unset'
                resize='none'
                border='none'
                minRows={1}
                fontSize={fontSize}
                fontWeight={fontWeight}
                textAlign={value ? 'center' : 'left'}
                placeholder={placeholder}
                value={value ?? ''}
                width={value ? '100%' : `${(placeholderRef.current?.offsetWidth ?? 0) + 10}px`}
                px={0}
                pt={0}
                pb={0}
                _focusVisible={{ outline: 'none' }}
                {...rest}
                sx={
                    placeholderColor ? { '&::placeholder': { color: placeholderColor } } : undefined
                }
            />
        </Box>
    );
}
