import { useRef } from 'react';
import { ListItem, OrderedList } from '@chakra-ui/react';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { EditableItemArea } from 'components/EditableItemArea';

import { UseItemListReturnType } from '../hooks/useItemList';

export function EditableInstructionList(props: UseItemListReturnType) {
    const { items, actionHandler } = props;
    const lastInputRef = useRef<HTMLTextAreaElement | null>(null);

    const instructionsList = items.map((instr, index) => (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            key={instr.key}
            layout
        >
            <ListItem color={instr.value ? '' : 'gray.400'}>
                <EditableItemArea
                    lastInputRef={index === items.length - 1 ? lastInputRef : null}
                    defaultStr='Enter instructions...'
                    isLast={index + 1 === items.length}
                    item={instr}
                    addNewEntry={actionHandler.addItem}
                    removeFromList={() => actionHandler.removeItem(index)}
                    setValue={(value: string) => actionHandler.setValue(index, value)}
                    fontSize='lg'
                    fontWeight='600'
                />
            </ListItem>
        </motion.div>
    ));

    return (
        <OrderedList>
            <AnimatePresence>
                <LayoutGroup>{instructionsList}</LayoutGroup>
            </AnimatePresence>
        </OrderedList>
    );
}
