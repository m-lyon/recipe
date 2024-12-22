import { useShallow } from 'zustand/shallow';

import { useRecipeStore } from '@recipe/stores';
import { CentredTextArea } from '@recipe/common/components';

export function EditableTitle() {
    const { title, setTitle } = useRecipeStore(
        useShallow((state) => ({
            title: state.title,
            setTitle: state.setTitle,
        }))
    );
    return (
        <CentredTextArea
            value={title}
            setValue={setTitle}
            fontSize='3xl'
            placeholder='Enter Recipe Title'
            placeholderColor='gray.400'
            aria-label='Enter recipe title'
            fontWeight={600}
        />
    );
}
