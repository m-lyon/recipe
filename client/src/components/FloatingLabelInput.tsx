import { FormControl, FormLabel, Input } from '@chakra-ui/react';

interface Props {
    firstFieldRef?: React.MutableRefObject<HTMLInputElement | null>;
    id: string;
    label: string;
    value: string;
    isInvalid: boolean;
    isRequired?: boolean;
    onChange: React.ChangeEventHandler<HTMLInputElement>;
}
export function FloatingLabelInput(props: Props) {
    const { firstFieldRef, id, label, isInvalid, isRequired, value, onChange } = props;
    return (
        <FormControl variant='floating' isInvalid={isInvalid}>
            <Input
                placeholder=''
                fontWeight={600}
                ref={firstFieldRef}
                id={id}
                value={value}
                onChange={onChange}
            />
            <FormLabel htmlFor={id} color='gray.400' fontWeight={600}>
                {label}
                {isRequired ? <span style={{ marginLeft: '0.1em' }}>*</span> : null}
            </FormLabel>
        </FormControl>
    );
}
