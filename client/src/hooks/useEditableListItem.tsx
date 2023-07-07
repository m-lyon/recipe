import { useRef, useState } from 'react';

export function useEditableListItem(defaultStr: string, setIngredients) {
    const inputRef = useRef(null);
    const [isEdited, setIsEdited] = useState<boolean>(false);
    const [inputValue, setInputValue] = useState<string>(defaultStr);

    const handleEdit = () => {
        if (!isEdited) {
            inputRef.current.setSelectionRange(0, 0);
        }
    };

    const handleChange = (value: string) => {
        console.log(value);
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
        } else if (isEdited) {
            // Add the current inputValue to the list of ingredients
            setIngredients((prevIngredients) => [...prevIngredients, inputValue]);
        }
    };

    return { inputValue, inputRef, isEdited, handleEdit, handleChange, handleSubmit };
}
