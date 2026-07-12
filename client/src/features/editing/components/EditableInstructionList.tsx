import { flushSync } from 'react-dom';
import { motion } from 'framer-motion';
import { createRef, useRef } from 'react';
import { useShallow } from 'zustand/shallow';
import { ListItem, OrderedList } from '@chakra-ui/react';

import { useRecipeStore } from '@recipe/stores';
import { EditableItemArea } from '@recipe/common/components';

interface Props {
    section: number;
}
export function EditableInstructionList(props: Props) {
    const { section } = props;
    const { instructions, addLine, insertLine, setInstruction, removeLine } = useRecipeStore(
        useShallow((state) => ({
            instructions: state.instructionSections[section].instructions,
            addLine: state.addEmptyInstructionLine,
            insertLine: state.insertInstructionLine,
            setInstruction: state.setInstruction,
            removeLine: state.removeInstruction,
        }))
    );
    // A stable ref per line, keyed by the line's key so it survives reordering
    // and stays attached without a re-render. This lets us focus a line whether
    // insertLine created a new blank or reused an existing one.
    const inputRefs = useRef<Map<string, React.RefObject<HTMLTextAreaElement>>>(new Map());
    const refFor = (key: string) => {
        let ref = inputRefs.current.get(key);
        if (!ref) {
            ref = createRef<HTMLTextAreaElement>();
            inputRefs.current.set(key, ref);
        }
        return ref;
    };

    // Drop refs for lines that no longer exist so the map can't grow unbounded
    // across repeated insert/remove cycles. Deleting during key iteration is safe.
    const liveKeys = new Set(instructions.map((instr) => instr.key));
    for (const key of inputRefs.current.keys()) {
        if (!liveKeys.has(key)) {
            inputRefs.current.delete(key);
        }
    }

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
            // Ensure a blank instruction exists immediately after this line and
            // move focus to it. insertLine returns the key of that line (a new
            // blank, or an existing one it reused). flushSync commits any newly
            // inserted line synchronously so its ref is attached before we focus.
            let focusKey = '';
            flushSync(() => {
                focusKey = insertLine(section, index);
            });
            inputRefs.current.get(focusKey)?.current?.focus();
        };
        const handleBackspace = () => {
            // Fired only on an empty entry. Move focus (cursor at end) to an
            // adjacent entry: the previous one, or the next one when this is the
            // first entry. The target already exists, so no re-render is needed.
            // Removal of the empty entry is left to the onBlur cleanup
            // (handleSubmit), which keeps the trailing blank when this is the
            // last entry rather than removing it.
            if (instructions.length === 1) {
                return; // only the trailing blank exists; nowhere to move
            }
            const targetKey = instructions[index === 0 ? index + 1 : index - 1].key;
            const target = inputRefs.current.get(targetKey)?.current;
            if (target) {
                target.focus();
                const end = target.value.length;
                target.setSelectionRange(end, end);
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
                <ListItem color={instr.value ? '' : 'gray.400'}>
                    <EditableItemArea
                        placeholder='Enter instructions...'
                        placeholderColor='gray.400'
                        value={instr.value}
                        handleChange={handleChange}
                        handleSubmit={handleSubmit}
                        handleEnter={handleEnter}
                        handleBackspace={handleBackspace}
                        optionalRef={refFor(instr.key)}
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
