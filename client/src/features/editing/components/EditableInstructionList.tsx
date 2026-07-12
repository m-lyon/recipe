import { useRef } from 'react';
import { motion } from 'framer-motion';
import { useShallow } from 'zustand/shallow';
import { ListItem, OrderedList } from '@chakra-ui/react';

import { useRecipeStore } from '@recipe/stores';
import { EditableItemArea } from '@recipe/common/components';

interface Props {
    section: number;
}
export function EditableInstructionList(props: Props) {
    const { section } = props;
    const focusRef = useRef<HTMLTextAreaElement>(null);
    const pendingFocusIndex = useRef<number | null>(null);
    const { instructions, addLine, insertLine, setInstruction, removeLine } = useRecipeStore(
        useShallow((state) => ({
            instructions: state.instructionSections[section].instructions,
            addLine: state.addEmptyInstructionLine,
            insertLine: state.insertInstructionLine,
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
            // Empty lines don't spawn another blank; blur-cleanup handles them.
            if (instr.value.trim() === '') {
                return;
            }
            // Insert a blank instruction immediately after this line and move
            // focus to it. For the last line, handleSubmit (onBlur) has already
            // appended the trailing blank, so only insert when not last.
            if (!isLast) {
                insertLine(section, index);
            }
            pendingFocusIndex.current = index + 1;
            setTimeout(() => {
                focusRef.current?.focus();
                pendingFocusIndex.current = null;
            }, 0);
        };

        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                key={instr.key}
                layout='position'
            >
                <ListItem color={instr.value ? '' : 'gray.400'}>
                    <EditableItemArea
                        placeholder='Enter instructions...'
                        placeholderColor='gray.400'
                        value={instr.value}
                        handleChange={handleChange}
                        handleSubmit={handleSubmit}
                        handleEnter={handleEnter}
                        optionalRef={index === pendingFocusIndex.current ? focusRef : null}
                        fontSize='lg'
                        fontWeight='600'
                        aria-label={`Enter instruction #${index + 1} for subsection ${section + 1}`}
                    />
                </ListItem>
            </motion.div>
        );
    });

    return <OrderedList pb='14px'>{instructionsList}</OrderedList>;
}
