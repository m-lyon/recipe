import { useRef } from 'react';
import { useShallow } from 'zustand/shallow';

import { useRecipeStore } from '@recipe/stores';
import { ConfirmDeleteAlert } from '@recipe/common/components';

import { useSubsectionDelete } from '../hooks/useSubsectionDelete';
import { EditableInstructionSubsection } from './EditableInstructionSubsection';

export function EditableInstructionSubsections() {
    const { numSections, remove } = useRecipeStore(
        useShallow((state) => ({
            numSections: state.instructionSections.length,
            remove: state.removeInstructionSection,
        }))
    );
    const ref = useRef<HTMLInputElement>(null);
    const { open, handleOpen, handleConfirm, handleCancel, indexToDelete, returnFocus } =
        useSubsectionDelete();

    return (
        <>
            {Array.from({ length: numSections }, (_, index) => (
                <EditableInstructionSubsection
                    key={index}
                    section={index}
                    optionalRef={index === indexToDelete ? ref : null}
                    handleOpen={handleOpen}
                />
            ))}
            <ConfirmDeleteAlert
                title='Delete Subsection'
                dialogText='Are you sure you want to delete this subsection and its contents?'
                open={open}
                onConfirm={() => handleConfirm(remove)}
                onCancel={handleCancel}
                finalFocusRef={ref}
                returnFocus={returnFocus}
            />
        </>
    );
}
