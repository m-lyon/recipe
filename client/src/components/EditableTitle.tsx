import { Editable, EditablePreview, EditableInput } from '@chakra-ui/react';
import { useRef, useState } from 'react';

export function EditableTitle() {
    const defaultStr = 'Enter Recipe Title';
    const inputRef = useRef(null);
    const [isEdited, setIsEdited] = useState<boolean>(false);
    const [inputValue, setInputValue] = useState<string>(defaultStr);

    const handleEdit = () => {
        if (!isEdited) {
            inputRef.current.setSelectionRange(0, 0);
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

    return (
        <Editable
            value={inputValue}
            selectAllOnFocus={false}
            onEdit={handleEdit}
            onSubmit={handleSubmit}
            onChange={handleChange}
            fontSize='3xl'
            textAlign='center'
        >
            <EditablePreview color={isEdited ? '' : 'gray.400'} />
            <EditableInput
                ref={inputRef}
                value={inputValue}
                color={isEdited ? '' : 'gray.400'}
                _focusVisible={{ outline: 'none' }}
            />
        </Editable>
    );
}
