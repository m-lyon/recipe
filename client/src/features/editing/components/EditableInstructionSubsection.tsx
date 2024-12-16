import { useShallow } from 'zustand/shallow';
import { ChangeEvent, RefObject } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';

import { useRecipeStore } from '@recipe/stores';
import { EditableText } from '@recipe/common/components';

import { EditableInstructionList } from './EditableInstructionList';

interface Props {
    section: number;
    optionalRef: RefObject<HTMLInputElement> | null;
    handleOpen: (index: number) => void;
}
export function EditableInstructionSubsection(props: Props) {
    const { section, optionalRef, handleOpen } = props;
    const { setName, name, remove, add } = useRecipeStore(
        useShallow((state) => ({
            setName: state.setInstructionSectionName,
            name: state.instructionSections[section].name,
            remove: state.removeInstructionSection,
            add: state.addInstructionSection,
        }))
    );
    const isLastSection = useRecipeStore(
        (state) => section === state.instructionSections.length - 1
    );
    const isPenultimateSection = useRecipeStore(
        (state) => section === state.instructionSections.length - 2
    );
    const lastSectionHasName = useRecipeStore((state) => {
        const name = state.instructionSections.at(-1)?.name;
        return name !== undefined && name?.trim() !== '';
    });
    const lastSectionHasInstructions = useRecipeStore(
        (state) => state.instructionSections.at(-1)!.instructions[0].value.trim() !== ''
    );

    const onChange = (e: ChangeEvent<HTMLInputElement>) => {
        setName(section, e.target.value);
    };
    const onSubmit = () => {
        if (!isLastSection) {
            if (
                isPenultimateSection &&
                (!name || name.trim() === '') &&
                !lastSectionHasName &&
                !lastSectionHasInstructions
            ) {
                // Special case where the last subsection is empty and the penultimate
                // subsection title is removed. In this case, remove the last subsection.
                return remove(section + 1);
            }
            if (!name || name.trim() === '') {
                return handleOpen(section);
            }
        }
        if (name && name.trim() !== '' && lastSectionHasName) {
            add();
        }
    };

    return (
        <AnimatePresence>
            <LayoutGroup>
                <motion.div
                    key={section}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    layout='position'
                >
                    <LayoutGroup>
                        <EditableText
                            placeholder='Enter Subsection'
                            value={name ?? ''}
                            onChange={onChange}
                            onSubmit={onSubmit}
                            fontSize='2xl'
                            textAlign='left'
                            pb='8px'
                            optionalRef={optionalRef}
                            fontWeight={600}
                            aria-label={`Enter title for instruction subsection ${section + 1}`}
                        />
                        <EditableInstructionList section={section} />
                    </LayoutGroup>
                </motion.div>
            </LayoutGroup>
        </AnimatePresence>
    );
}
