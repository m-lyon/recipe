import { useEffect, useRef, useState } from 'react';
import { Box, Input, InputProps } from '@chakra-ui/react';

interface Props extends InputProps {
    value: string;
    setValue: (value: string) => void;
    maintainMinWidth?: boolean;
    optionalRef?: React.RefObject<HTMLInputElement> | null;
}
export function CentredInput(props: Props) {
    const { value, setValue, fontSize, fontWeight, maintainMinWidth, placeholder, ...rest } = props;
    const ref = useRef<HTMLInputElement | null>(null);
    const spanRef = useRef<HTMLSpanElement>(null);
    const minSpanRef = useRef<HTMLSpanElement>(null);
    const parentRef = useRef<HTMLDivElement>(null);
    const [displayValue, setDisplayValue] = useState<string | null>(null);
    const [displayWidth, setDisplayWidth] = useState<string>('auto');
    const [minWidth, setMinWidth] = useState(0);
    const overflow = (spanRef.current?.scrollWidth ?? 0) > (parentRef.current?.offsetWidth ?? 0);
    const displayMaxWidth = `${parentRef.current?.offsetWidth}px`;

    useEffect(() => {
        if (overflow) {
            setDisplayWidth(displayMaxWidth);
        } else {
            setDisplayWidth(`${spanRef.current?.scrollWidth}px`);
        }
        setDisplayValue(value);
    }, [overflow, value, displayMaxWidth]);
    useEffect(() => {
        if (maintainMinWidth) {
            setMinWidth(minSpanRef.current?.offsetWidth ?? 0);
        }
    }, [maintainMinWidth, placeholder]);

    return (
        <Box textAlign='center' ref={parentRef} width='100%'>
            <Box
                as='span'
                ref={spanRef}
                position='absolute'
                fontSize={fontSize}
                fontWeight={fontWeight}
                visibility='hidden'
                whiteSpace='pre'
                overflowX='hidden'
                display='block'
                maxWidth={displayMaxWidth}
            >
                {value || placeholder || ''}
            </Box>
            {maintainMinWidth && (
                <Box
                    as='span'
                    ref={minSpanRef}
                    position='absolute'
                    fontSize={fontSize}
                    fontWeight={fontWeight}
                    visibility='hidden'
                    whiteSpace='pre'
                >
                    {placeholder}
                </Box>
            )}
            <Input
                ref={ref}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === 'Escape') {
                        ref.current?.blur();
                    }
                }}
                onChange={(e) => setValue(e.target.value)}
                minH='unset'
                border='none'
                fontSize={fontSize}
                fontWeight={fontWeight}
                placeholder={placeholder}
                value={overflow ? (value ?? '') : (displayValue ?? '')}
                minWidth={maintainMinWidth ? `${minWidth}px` : undefined}
                width={displayWidth}
                px={0}
                pt={0}
                _focusVisible={{ outline: 'none' }}
                {...rest}
            />
        </Box>
    );
}
