import { useRef, useState } from 'react';

interface ActionHandler {
    edit: () => void;
    change: (value: string) => void;
    submit: (value: string) => void;
}
export interface UseEditableReturnType {
    inputValue: string;
    inputRef: React.RefObject<HTMLInputElement>;
    defaultStr: string;
    isEdited: boolean;
    actionHandler: ActionHandler;
}
export function useEditable(defaultStr: string): UseEditableReturnType {
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

    const actionHandler = { edit: handleEdit, change: handleChange, submit: handleSubmit };

    return { inputValue, inputRef, defaultStr, isEdited, actionHandler };
}
