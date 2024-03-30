import { useRef, useState } from 'react';

interface ActionHandler {
    edit: () => void;
    change: (value: string) => void;
    submit: (value: string) => void;
}
export interface UseEditableReturnType {
    value: string | null;
    displayStr: string;
    inputRef: React.RefObject<HTMLInputElement>;
    isEdited: boolean;
    actionHandler: ActionHandler;
}
export function useEditable(defaultStr: string, endWithPeriod?: boolean): UseEditableReturnType {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [isEdited, setIsEdited] = useState<boolean>(false);
    const [value, setInputValue] = useState<null | string>(null);

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
        if (value.trim() === '' || !isEdited) {
            // Reset the value to default when the field is empty
            setIsEdited(false);
            setInputValue(null);
            return;
        }
        if (!value.endsWith('.') && endWithPeriod) {
            setInputValue(value + '.');
        } else {
            setInputValue(value);
        }
        if (!isEdited) {
            setIsEdited(true);
        }
    };
    const displayStr = value === null ? defaultStr : value;
    const actionHandler = { edit: handleEdit, change: handleChange, submit: handleSubmit };

    return { value, displayStr, inputRef, isEdited, actionHandler };
}
