import { ChangeEventHandler, MutableRefObject } from 'react';
import { FormControl, FormLabel, Input, InputProps } from '@chakra-ui/react';

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
        <FormControl
            invalid={isInvalid}
            disabled={isDisabled}
            sx={{
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
                fontWeight={fontWeight ?? 600}
                ref={inputRef}
                id={id}
                {...rest}
                aria-label={label}
            />
            <FormLabel htmlFor={id} color='gray.400' fontWeight={fontWeight ?? 600}>
                {label}
                {isRequired ? <span style={{ marginLeft: '0.1em' }}>*</span> : null}
            </FormLabel>
        </FormControl>
    );
}
