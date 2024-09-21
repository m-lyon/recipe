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
        <FormControl variant='floating' isInvalid={isInvalid} isDisabled={isDisabled}>
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
