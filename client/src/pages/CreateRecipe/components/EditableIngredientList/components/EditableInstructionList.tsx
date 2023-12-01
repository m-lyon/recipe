import { OrderedList, ListItem } from '@chakra-ui/react';
import { EditableItem } from '../../../../../components/EditableItem';
import { UseItemListReturnType } from '../../../hooks/useItemList';
import { useEnterFocus } from '../../../../../hooks/useEnterCapture';
import { RefObject } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';

export function EditableInstructionList(props: UseItemListReturnType) {
    const { items, defaultStr, actionHandler } = props;

    const [lastInputRef, handleEnter] = useEnterFocus();

    const instructionsList = items.map((instr, index) => (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            key={instr.key}
            layout
        >
            <ListItem color={instr.isEdited ? '' : 'gray.400'}>
                <EditableItem
                    ref={
                        index === items.length - 1
                            ? (lastInputRef as RefObject<HTMLInputElement>)
                            : null
                    }
                    defaultStr={defaultStr}
                    isLast={index + 1 === items.length}
                    item={instr}
                    addNewEntry={actionHandler.addItem}
                    removeFromList={() => actionHandler.removeItem(index)}
                    setValue={(value: string) => actionHandler.setValue(index, value)}
                    toggleIsEdited={() => actionHandler.toggleEdited(index)}
                    handleEnter={handleEnter}
                    fontSize='lg'
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
