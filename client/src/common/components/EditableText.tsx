import { Input, InputProps } from '@chakra-ui/react';

interface Props extends InputProps {
    defaultStr: string;
    value: string;
    handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleSubmit: () => void;
    handleEnter?: () => void;
    optionalRef?: React.RefObject<HTMLInputElement> | null;
}
export function EditableText(props: Props) {
    const { defaultStr, value, handleChange, handleSubmit, optionalRef, ...rest } = props;

    return (
        <Input
            ref={optionalRef}
            value={value}
            placeholder={defaultStr}
            onChange={handleChange}
            onBlur={handleSubmit}
            minH='unset'
            border='none'
            px={0}
            pt={0}
            _focusVisible={{ outline: 'none' }}
            {...rest}
        />
    );
}
