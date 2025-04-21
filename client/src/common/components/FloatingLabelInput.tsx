import { Field, Input, InputProps } from '@chakra-ui/react';
import { ChangeEventHandler, MutableRefObject } from 'react';

interface Props extends InputProps {
    id: string;
    label: string;
    value: string;
    invalid: boolean;
    onChange: ChangeEventHandler<HTMLInputElement>;
    inputRef?: MutableRefObject<HTMLInputElement | null>;
    required?: boolean;
    disabled?: boolean;
}
export function FloatingLabelInput(props: Props) {
    const { inputRef, id, label, invalid, required, disabled, fontWeight, ...rest } = props;
    return (
        <Field.Root
            invalid={invalid}
            disabled={disabled}
            css={{
                '& :focus-within label': {
                    transform: 'scale(0.85) translateY(-24px)',
                },
                '& input:not(:placeholder-shown) + label, .chakra-select__wrapper + label, textarea:not(:placeholder-shown) ~ label':
                    {
                        transform: 'scale(0.85) translateY(-24px)',
                    },
                '& label': {
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
            <Field.Label htmlFor={id} color='gray.400' fontWeight={fontWeight ?? 600}>
                {label}
                {required ? <span style={{ marginLeft: '0.1em' }}>*</span> : null}
            </Field.Label>
        </Field.Root>
    );
}
