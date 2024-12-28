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

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setNotes(e.target.value);
    };
    const handleSubmit = () => {
        if (notes.trim() === '') {
            setNotes('');
        }
    };

    return (
        <EditableItemArea
            placeholder='Enter notes...'
            placeholderColor='gray.400'
            value={notes}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
            fontSize='md'
            fontWeight='medium'
            textAlign='left'
            aria-label='Edit recipe notes'
            pb={0}
            mt='2em'
        />
    );
}
