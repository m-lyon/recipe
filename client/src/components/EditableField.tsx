import { Editable, EditablePreview, EditableInput } from '@chakra-ui/react';
import { useEditable } from '../hooks/useEditable';
import * as CSS from 'csstype';

interface IEditableField {
    defaultStr: string;
    fontSize?: string;
    textAlign: CSS.Property.TextAlign;
}

export function EditableField(props: IEditableField) {
    const { defaultStr, fontSize, textAlign } = props;
    const { inputValue, inputRef, isEdited, handleEdit, handleChange, handleSubmit } =
        useEditable(defaultStr);

    return (
        <Editable
            value={inputValue}
            selectAllOnFocus={false}
            onEdit={handleEdit}
            onSubmit={handleSubmit}
            onChange={handleChange}
            fontSize={fontSize}
            textAlign={textAlign}
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
