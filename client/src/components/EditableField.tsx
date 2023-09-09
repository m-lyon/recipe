import { Editable, EditablePreview, EditableInput } from '@chakra-ui/react';
import { UseEditableReturnType } from '../hooks/useEditable';
import * as CSS from 'csstype';

interface EditableField extends UseEditableReturnType {
    fontSize?: string;
    textAlign: CSS.Property.TextAlign;
}
export function EditableField(props: EditableField) {
    const { inputValue, inputRef, isEdited, actionHandler, fontSize, textAlign } = props;

    return (
        <Editable
            value={inputValue}
            selectAllOnFocus={false}
            onEdit={actionHandler.edit}
            onSubmit={actionHandler.submit}
            onChange={actionHandler.change}
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
