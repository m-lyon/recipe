import { Text } from '@chakra-ui/react';
import { useShallow } from 'zustand/shallow';

import { useRecipeStore } from '@recipe/stores';
import { EditableItemArea } from '@recipe/common/components';

export function EditableNotes() {
    const { notes, setNotes } = useRecipeStore(
        useShallow((state) => ({
            notes: state.notes,
            setNotes: state.setNotes,
        }))
    );
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
