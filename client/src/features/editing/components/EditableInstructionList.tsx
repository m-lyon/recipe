import { useRef } from 'react';
import { motion } from 'framer-motion';
import { ListItem, OrderedList } from '@chakra-ui/react';

import { EditableItemArea } from '@recipe/common/components';

import { UseInstructionListReturnType } from '../hooks/useInstructionsList';

interface Props {
    instructions: UseInstructionListReturnType['state'][0]['instructions'];
    addLine: () => void;
    removeLine: (index: number) => void;
    setLine: (index: number, value: string) => void;
    sectionNum: number;
}
export function EditableInstructionList(props: Props) {
    const { instructions, addLine, removeLine, setLine, sectionNum } = props;
    const lastInputRef = useRef<HTMLTextAreaElement | null>(null);

    const instructionsList = instructions.map((instr, index) => {
        const isLast = index + 1 === instructions.length;

        const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            setLine(index, e.target.value);
        };
        const handleSubmit = () => {
            // Reset the value to the default text when the field is empty, if last
            // in list, or remove item if not
            if (instr.value.trim() === '') {
                if (!isLast) {
                    removeLine(index);
                } else {
                    setLine(index, '');
                }
            } else {
                if (isLast) {
                    addLine();
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
                <ListItem color={instr.value ? '' : 'gray.400'}>
                    <EditableItemArea
                        defaultStr='Enter instructions...'
                        value={instr.value}
                        handleChange={handleChange}
                        handleSubmit={handleSubmit}
                        handleEnter={handleEnter}
                        optionalRef={index === instructions.length - 1 ? lastInputRef : null}
                        fontSize='lg'
                        fontWeight='600'
                        aria-label={`Enter instruction #${index + 1} for subsection ${sectionNum}`}
                    />
                </ListItem>
            </motion.div>
        );
    });

    return <OrderedList>{instructionsList}</OrderedList>;
}
