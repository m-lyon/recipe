import * as CSS from 'csstype';
import { Editable, EditableInput, EditablePreview } from '@chakra-ui/react';

import type { UseEditableReturnType } from '@recipe/common/hooks';

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
