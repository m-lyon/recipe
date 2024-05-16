import { UseEditableReturnType } from '../hooks/useEditable';
import { EditableField } from '../../../components/EditableField';

export function EditableTitle(props: UseEditableReturnType) {
    return <EditableField {...props} fontSize='3xl' textAlign='center' />;
}
