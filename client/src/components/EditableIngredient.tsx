import { ListItem, Editable, EditablePreview, EditableInput } from '@chakra-ui/react';
import { useEditable } from '../hooks/useEditable';
import { useEditableListItem } from '../hooks/useEditableListItem';

export function EditableIngredient(props) {
    const { setIngredients } = props;
    const { inputValue, inputRef, isEdited, handleEdit, handleChange, handleSubmit } =
        useEditableListItem('Enter ingredient', setIngredients);
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
