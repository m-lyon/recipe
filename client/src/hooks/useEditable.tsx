import { useRef, useState } from 'react';

export function useEditable(defaultStr: string) {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [isEdited, setIsEdited] = useState<boolean>(false);
    const [inputValue, setInputValue] = useState<string>(defaultStr);

    const handleEdit = () => {
        if (!isEdited) {
            inputRef.current?.setSelectionRange(0, 0);
        }
    };

    const handleChange = (value: string) => {
        if (!isEdited) {
            setIsEdited(true);
            setInputValue(value.replace(defaultStr, ''));
        } else {
            setInputValue(value);
        }
    };

    const handleSubmit = (value: string) => {
        if (value.trim() === '') {
            // Reset the value to the default text when the field is empty
            setIsEdited(false);
            setInputValue(defaultStr);
        }
    };

    return { inputValue, inputRef, isEdited, handleEdit, handleChange, handleSubmit };
}
