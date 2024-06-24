import { Editable, EditableInput, EditablePreview, EditableProps } from '@chakra-ui/react';

import type { UseEditableReturnType } from '@recipe/common/hooks';

interface EditableField extends Omit<UseEditableReturnType, 'value'>, Omit<EditableProps, 'value'> {
    ariaLabel: string;
}
export function EditableField(props: EditableField) {
    const { displayStr, inputRef, isEdited, actionHandler, ariaLabel, ...rest } = props;

    return (
        <Editable
            value={displayStr}
            selectAllOnFocus={false}
            onEdit={actionHandler.edit}
            onSubmit={actionHandler.submit}
            onChange={actionHandler.change}
            {...rest}
        >
            <EditablePreview color={isEdited ? '' : 'gray.400'} aria-label={ariaLabel} />
            <EditableInput
                ref={inputRef}
                value={displayStr}
                color={isEdited ? '' : 'gray.400'}
                _focusVisible={{ outline: 'none' }}
            />
        </Editable>
    );
}
