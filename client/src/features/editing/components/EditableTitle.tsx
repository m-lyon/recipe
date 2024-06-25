import { EditableField } from '@recipe/common/components';
import { UseEditableReturnType } from '@recipe/common/hooks';

export function EditableTitle(props: UseEditableReturnType) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { value, ...rest } = props;
    return (
        <EditableField {...rest} fontSize='3xl' textAlign='center' ariaLabel='Edit recipe title' />
    );
}
