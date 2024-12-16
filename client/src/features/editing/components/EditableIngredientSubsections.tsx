import { useRef } from 'react';
import { VStack } from '@chakra-ui/react';
import { useShallow } from 'zustand/shallow';

import { useRecipeStore } from '@recipe/stores';
import { ConfirmDeleteAlert } from '@recipe/common/components';

import { useSubsectionDelete } from '../hooks/useSubsectionDelete';
import { EditableIngredientSubsection } from './EditableIngredientSubsection';

export function EditableIngredientSubsections() {
    const ref = useRef<HTMLInputElement>(null);
    const { numSections, remove } = useRecipeStore(
        useShallow((state) => ({
            numSections: state.ingredientSections.length,
            remove: state.removeIngredientSection,
        }))
    );
    const { isOpen, handleOpen, handleConfirm, handleCancel, indexToDelete, returnFocus } =
        useSubsectionDelete();

    return (
        <VStack spacing='24px' align='left'>
            {Array.from({ length: numSections }, (_, index) => (
                <EditableIngredientSubsection
                    key={index}
                    section={index}
                    optionalRef={index === indexToDelete ? ref : null}
                    handleOpen={handleOpen}
                />
            ))}
            <ConfirmDeleteAlert
                title='Delete Subsection'
                dialogText='Are you sure you want to delete this subsection and its contents?'
                isOpen={isOpen}
                onConfirm={() => handleConfirm(remove)}
                onCancel={handleCancel}
                finalFocusRef={ref}
                returnFocus={returnFocus}
            />
        </VStack>
    );
}
