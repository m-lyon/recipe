import { Text } from '@chakra-ui/react';

import { EditableItemArea } from '@recipe/common/components';

export interface EditableNotesProps {
    notes: string;
    setNotes: (notes: string) => void;
}
export function EditableNotes(props: EditableNotesProps) {
    const { notes, setNotes } = props;
    const defaultStr = 'Enter notes...';

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setNotes(e.target.value);
    };
    const handleSubmit = () => {
        if (notes.trim() === '') {
            setNotes('');
        }
    };

    return (
        <>
            <Text fontSize='2xl'>Notes</Text>
            <EditableItemArea
                defaultStr={defaultStr}
                value={notes}
                handleChange={handleChange}
                handleSubmit={handleSubmit}
                fontSize='md'
                fontWeight='medium'
                textAlign='left'
                aria-label='Edit recipe notes'
            />
        </>
    );
}
