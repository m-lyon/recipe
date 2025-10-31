import { useRef } from 'react';
import { motion } from 'framer-motion';
import { useShallow } from 'zustand/shallow';

import { useRecipeStore } from '@recipe/stores';
import { EditableItemArea } from '@recipe/common/components';

interface Props {
    section: number;
}
export function EditableInstructionList(props: Props) {
    const { section } = props;
    const lastInputRef = useRef<HTMLTextAreaElement>(null);
    const { instructions, addLine, setInstruction, removeLine } = useRecipeStore(
        useShallow((state) => ({
            instructions: state.instructionSections[section].instructions,
            addLine: state.addEmptyInstructionLine,
            setInstruction: state.setInstruction,
            removeLine: state.removeInstruction,
        }))
    );

    const instructionsList = instructions.map((instr, index) => {
        const isLast = index + 1 === instructions.length;

        const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            setInstruction(section, index, e.target.value);
        };
        const handleSubmit = () => {
            // Reset the value to the default text when the field is empty, if last
            // in list, or remove item if not
            if (instr.value.trim() === '') {
                if (!isLast) {
                    removeLine(section, index);
                } else {
                    setInstruction(section, index, '');
                }
            } else {
                if (isLast) {
                    addLine(section);
                }
            }
        };
        const handleEnter = () => {
            if (lastInputRef.current) {
                setTimeout(() => {
                    lastInputRef.current?.focus();
                }, 0);
            }
        };

        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                key={instr.key}
                layout='position'
            >
                <li style={{ color: instr.value ? '' : 'gray' }}>
                    <EditableItemArea
                        placeholder='Enter instructions...'
                        placeholderColor='gray.400'
                        value={instr.value}
                        handleChange={handleChange}
                        handleSubmit={handleSubmit}
                        handleEnter={handleEnter}
                        optionalRef={index === instructions.length - 1 ? lastInputRef : null}
                        fontSize='lg'
                        fontWeight='600'
                        aria-label={`Enter instruction #${index + 1} for subsection ${section + 1}`}
                    />
                </li>
            </motion.div>
        );
    });

    return <ol style={{ paddingBottom: '14px' }}>{instructionsList}</ol>;
}
