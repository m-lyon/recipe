import { Box, Input, InputProps } from '@chakra-ui/react';
import { ChangeEventHandler, MutableRefObject } from 'react';

interface Props extends InputProps {
    id: string;
    label: string;
    value: string;
    isInvalid: boolean;
    onChange: ChangeEventHandler<HTMLInputElement>;
    inputRef?: MutableRefObject<HTMLInputElement | null>;
    isRequired?: boolean;
    isDisabled?: boolean;
}
export function FloatingLabelInput(props: Props) {
    const { inputRef, id, label, isInvalid, isRequired, isDisabled, fontWeight, ...rest } = props;
    return (
        <Box
            position='relative'
            data-invalid={isInvalid ? '' : undefined}
            data-disabled={isDisabled ? '' : undefined}
            css={{
                '&:focus-within label': {
                    transform: 'scale(0.85) translateY(-24px)',
                },
                'input:not(:placeholder-shown) + label, .chakra-select__wrapper + label, textarea:not(:placeholder-shown) ~ label':
                    {
                        transform: 'scale(0.85) translateY(-24px)',
                    },
                label: {
                    top: 0,
                    left: 0,
                    zIndex: 1,
                    position: 'absolute',
                    backgroundColor: 'white',
                    pointerEvents: 'none',
                    mx: 3,
                    px: 1,
                    my: 2,
                    transformOrigin: 'left top',
                },
            }}
        >
            <Input
                placeholder=''
                fontWeight={fontWeight ?? 'semibold'}
                ref={inputRef}
                id={id}
                invalid={isInvalid}
                disabled={isDisabled}
                {...rest}
                aria-label={label}
            />
            <label
                htmlFor={id}
                style={{
                    color: 'gray',
                    fontWeight: 'semibold',
                }}
            >
                {label}
                {isRequired ? <span style={{ marginLeft: '0.1em' }}>*</span> : null}
            </label>
        </Box>
    );
}
