import { useRef } from 'react';
import { OrderedList } from '@chakra-ui/react';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';

import { ConfirmDeleteAlert, EditableText } from '@recipe/common/components';

import { useSubsectionDelete } from '../hooks/useSubsectionDelete';
import { EditableInstructionList } from './EditableInstructionList';
import { UseInstructionListReturnType } from '../hooks/useInstructionsList';

export function EditableInstructionSubsections(props: UseInstructionListReturnType) {
    const { state, actionHandler } = props;
    const ref = useRef<HTMLInputElement>(null);
    const { isOpen, handleOpen, handleConfirm, handleCancel, indexToDelete, returnFocus } =
        useSubsectionDelete();

    const subsections = state.map((subsection, sectionIndex) => {
        const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            actionHandler.setSubsectionName(sectionIndex, e.target.value);
        };
        const onSubmit = () => {
            if (state.length > 1 && sectionIndex !== state.length - 1) {
                if (
                    sectionIndex === state.length - 2 &&
                    (!subsection.name || subsection.name.trim() === '') &&
                    (!state.at(-1)!.name || state.at(-1)!.name!.trim() === '') &&
                    state.at(-1)!.instructions[0].value.trim() === ''
                ) {
                    // Special case where the last subsection is empty and the penultimate
                    // subsection title is removed. In this case, remove the last subsection.
                    return actionHandler.removeSubsection(sectionIndex + 1);
                }
                if (!subsection.name || subsection.name.trim() === '') {
                    return handleOpen(sectionIndex);
                }
            }
            if (
                subsection.name &&
                subsection.name.trim() !== '' &&
                state.at(-1)?.name &&
                state.at(-1)?.name?.trim() !== ''
            ) {
                actionHandler.addSubsection();
            }
        };

        return (
            <motion.div
                key={sectionIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                layout='position'
            >
                <LayoutGroup>
                    <EditableText
                        placeholder='Enter Subsection'
                        value={subsection.name ?? ''}
                        onChange={onChange}
                        onSubmit={onSubmit}
                        fontSize='2xl'
                        textAlign='left'
                        pb='8px'
                        optionalRef={indexToDelete === sectionIndex ? ref : null}
                        fontWeight={600}
                        aria-label={`Enter title for instruction subsection ${sectionIndex + 1}`}
                    />
                    <OrderedList pb='14px'>
                        <EditableInstructionList
                            key={sectionIndex}
                            instructions={subsection.instructions}
                            addLine={() => actionHandler.addLine(sectionIndex)}
                            removeLine={(index) => actionHandler.removeLine(sectionIndex, index)}
                            setLine={(index, value) =>
                                actionHandler.setLine(sectionIndex, index, value)
                            }
                            sectionNum={sectionIndex + 1}
                        />
                    </OrderedList>
                </LayoutGroup>
            </motion.div>
        );
    });

    return (
        <>
            <AnimatePresence>
                <LayoutGroup>{subsections}</LayoutGroup>
            </AnimatePresence>
            <ConfirmDeleteAlert
                title='Delete Subsection'
                dialogText='Are you sure you want to delete this subsection and its contents?'
                isOpen={isOpen}
                onConfirm={() => handleConfirm(actionHandler.removeSubsection)}
                onCancel={handleCancel}
                finalFocusRef={ref}
                returnFocus={returnFocus}
            />
        </>
    );
}
