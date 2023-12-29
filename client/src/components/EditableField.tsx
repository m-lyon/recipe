import { Editable, EditablePreview, EditableInput } from '@chakra-ui/react';
import { UseEditableReturnType } from '../pages/CreateRecipe/hooks/useEditable';
import * as CSS from 'csstype';

interface EditableField extends UseEditableReturnType {
    fontSize?: string;
    fontWeight?: string;
    textAlign: CSS.Property.TextAlign;
}
export function EditableField(props: EditableField) {
    const { displayStr, inputRef, isEdited, actionHandler, fontSize, fontWeight, textAlign } =
        props;

    return (
        <Editable
            value={displayStr}
            selectAllOnFocus={false}
            onEdit={actionHandler.edit}
            onSubmit={actionHandler.submit}
            onChange={actionHandler.change}
            fontSize={fontSize}
            textAlign={textAlign}
            fontWeight={fontWeight}
        >
            <EditablePreview color={isEdited ? '' : 'gray.400'} />
            <EditableInput
                ref={inputRef}
                value={displayStr}
                color={isEdited ? '' : 'gray.400'}
                _focusVisible={{ outline: 'none' }}
            />
        </Editable>
    );
}
