import { Text } from '@chakra-ui/react';
import { UseEditableReturnType } from '../hooks/useEditable';
import { EditableField } from '../../../components/EditableField';

export function EditableNotes(props: UseEditableReturnType) {
    return (
        <>
            <Text fontSize='2xl'>Notes</Text>
            <EditableField {...props} fontSize='md' fontWeight='medium' textAlign='left' />
        </>
    );
}
