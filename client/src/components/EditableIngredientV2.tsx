import { ListItem, Editable, EditablePreview, EditableInput } from '@chakra-ui/react';
import { useRef, useState, useEffect } from 'react';

interface Props {
    isLast: boolean;
    removeFromList: () => void;
    inputValue: string;
    isEdited: boolean;
    setValue: (value: string) => void;
    addNewEntry: () => void;
    toggleIsEdited: () => void;
}
export function EditableIngredient({
    isLast,
    removeFromList,
    inputValue,
    isEdited,
    setValue,
    addNewEntry,
    toggleIsEdited,
}: Props) {
    const inputRef = useRef(null);
    const defaultStr = 'Enter ingredient';

    if (isLast && inputValue === defaultStr && isEdited) {
        toggleIsEdited();
    }

    const handleEdit = () => {
        if (!isEdited) {
            inputRef.current.setSelectionRange(0, 0);
        }
    };

    const handleChange = (value: string) => {
        if (!isEdited) {
            toggleIsEdited();
            setValue(value.replace(defaultStr, ''));
            console.log('ive been called for ', inputValue);
        } else {
            setValue(value);
        }
    };

    const handleSubmit = (value: string) => {
        // Reset the value to the default text when the field is empty, if last
        // in list, or remove item if not
        if (value.trim() === '') {
            if (isLast) {
                setValue(defaultStr);
                if (isEdited) {
                    toggleIsEdited();
                }
            } else {
                removeFromList();
            }
        } else {
            if (isLast && isEdited) {
                addNewEntry();
            }
        }
    };

    useEffect(() => {
        const handleKeyPress = (event) => {
            if (event.key === 'Enter') {
                console.log('enter was pressed');
            }
        };
        if (inputRef.current) {
            inputRef.current.addEventListener('keydown', handleKeyPress);
        }

        return () => {
            if (inputRef.current) {
                // Cleanup: Remove the event listener when the component unmounts
                inputRef.current.removeEventListener('keydown', handleKeyPress);
            }
        };
    }, []);

    return (
        <ListItem color={isEdited ? '' : 'gray.400'}>
            <Editable
                value={inputValue}
                selectAllOnFocus={false}
                onEdit={handleEdit}
                onSubmit={handleSubmit}
                onChange={handleChange}
                textAlign='left'
            >
                <EditablePreview />
                <EditableInput
                    ref={inputRef}
                    value={inputValue}
                    _focusVisible={{ outline: 'none' }}
                />
            </Editable>
        </ListItem>
    );
}
