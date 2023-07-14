import { useRef, useState } from 'react';

interface UseEditableListItemReturn {}
export function useEditableListItem(numIngredients: number, setIngredients, index: number) {
    const inputRef = useRef(null);
    const defaultStr = 'Enter ingredient';
    const [isEdited, setIsEdited] = useState<boolean>(false);
    const [inputValue, setInputValue] = useState<string>(defaultStr);

    const handleEdit = () => {
        if (!isEdited) {
            inputRef.current.setSelectionRange(0, 0);
        }
    };

    const handleChange = (value: string) => {
        console.log('handleChange');
        if (!isEdited) {
            setIsEdited(true);
            setInputValue(value.replace(defaultStr, ''));
        } else {
            setInputValue(value);
        }
    };

    const handleSubmit = (value: string) => {
        // Reset the value to the default text when the field is empty, if last
        // in list, or remove item if not
        console.log('handleSubmit called, index -> ', index);
        if (value.trim() === '') {
            if (index + 1 === numIngredients) {
                // Last entry in ingredient list
                setIsEdited(false);
                setInputValue(defaultStr);
            } else {
                setIngredients((prevIngredients: string[]) => {
                    console.log(prevIngredients);
                    return prevIngredients.filter((value, idx) => {
                        console.log(
                            'setIngredients, value -> ',
                            value,
                            ', idx -> ',
                            idx,
                            idx !== index
                        );
                        return idx !== index;
                    });
                });
            }
        } else if (isEdited) {
            // Add the current inputValue to the list of ingredients
            setIngredients((prevIngredients: string[]) => {
                if (prevIngredients.length === 1 && prevIngredients[0] === '') {
                    return [`${index} ${inputValue}`, ''];
                } else {
                    return [...prevIngredients.slice(0, -1), `${index} ${inputValue}`, ''];
                }
            });
        }
    };

    return { inputValue, inputRef, isEdited, handleEdit, handleChange, handleSubmit };
}
