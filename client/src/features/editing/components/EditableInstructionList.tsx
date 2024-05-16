import { useRef } from 'react';
import { ListItem, OrderedList } from '@chakra-ui/react';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';

import { EditableItemArea } from 'components/EditableItemArea';

import { UseItemListReturnType } from '../hooks/useItemList';

export function EditableInstructionList(props: UseItemListReturnType) {
    const { items, actionHandler } = props;
    const lastInputRef = useRef<HTMLTextAreaElement | null>(null);

    const instructionsList = items.map((instr, index) => {
        const isLast = index + 1 === items.length;

        const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            actionHandler.setValue(index, e.target.value);
        };
        const handleSubmit = () => {
            // Reset the value to the default text when the field is empty, if last
            // in list, or remove item if not
            if (instr.value.trim() === '') {
                if (!isLast) {
                    actionHandler.removeItem(index);
                } else {
                    actionHandler.setValue(index, '');
                }
            } else {
                if (!instr.value.endsWith('.')) {
                    actionHandler.setValue(index, instr.value + '.');
                }
                if (isLast) {
                    actionHandler.addItem();
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
                layout
            >
                <ListItem color={instr.value ? '' : 'gray.400'}>
                    <EditableItemArea
                        defaultStr='Enter instructions...'
                        value={instr.value}
                        handleChange={handleChange}
                        handleSubmit={handleSubmit}
                        handleEnter={handleEnter}
                        optionalRef={index === items.length - 1 ? lastInputRef : null}
                        fontSize='lg'
                        fontWeight='600'
                    />
                </ListItem>
            </motion.div>
        );
    });

    return (
        <OrderedList>
            <AnimatePresence>
                <LayoutGroup>{instructionsList}</LayoutGroup>
            </AnimatePresence>
        </OrderedList>
    );
}
