import { EditableField } from '@recipe/common/components';

import { UseEditableReturnType } from '../hooks/useEditable';

export function EditableTitle(props: UseEditableReturnType) {
    return <EditableField {...props} fontSize='3xl' textAlign='center' />;
}
