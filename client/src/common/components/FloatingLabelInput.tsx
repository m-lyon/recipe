import { FormControl, FormLabel, Input } from '@chakra-ui/react';

interface Props {
    inputRef?: React.MutableRefObject<HTMLInputElement | null>;
    id: string;
    label: string;
    value: string;
    isInvalid: boolean;
    isRequired?: boolean;
    isDisabled?: boolean;
    onChange: React.ChangeEventHandler<HTMLInputElement>;
}
export function FloatingLabelInput(props: Props) {
    const { inputRef, id, label, isInvalid, isRequired, isDisabled, value, onChange } = props;
    return (
        <FormControl variant='floating' isInvalid={isInvalid} isDisabled={isDisabled}>
            <Input
                placeholder=''
                fontWeight={600}
                ref={inputRef}
                id={id}
                value={value}
                onChange={onChange}
                aria-label={label}
            />
            <FormLabel htmlFor={id} color='gray.400' fontWeight={600}>
                {label}
                {isRequired ? <span style={{ marginLeft: '0.1em' }}>*</span> : null}
            </FormLabel>
        </FormControl>
    );
}
