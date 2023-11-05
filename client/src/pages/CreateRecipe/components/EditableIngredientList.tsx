import { Reorder } from 'framer-motion';
import { Box, VStack } from '@chakra-ui/react';
import { EditableIngredient } from './EditableIngredient';
import { Tag, TagLabel, TagCloseButton } from '@chakra-ui/react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { FinishedIngredient, UseIngredientListReturnType } from '../hooks/useIngredientList';
import { getFinishedIngredientStr } from '../hooks/useIngredientList';

export function EditableIngredientList(props: UseIngredientListReturnType) {
    const { state, actionHandler, setFinished, removeFinished } = props;

    const finishedIngredients = state.finished.map((item: FinishedIngredient, index: number) => {
        return (
            <Reorder.Item
                key={item.key}
                value={item}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <Tag size='lg' marginBottom='5px'>
                    <TagLabel>{getFinishedIngredientStr(item)}</TagLabel>
                    <TagCloseButton onClick={() => removeFinished(index)} />
                </Tag>
            </Reorder.Item>
        );
    });

    return (
        <VStack spacing='24px' align='left'>
            <Box fontSize='2xl'>Ingredients</Box>
            <VStack spacing='10px' align='left'>
                <LayoutGroup>
                    <Reorder.Group
                        values={state.finished}
                        onReorder={setFinished}
                        as='ul'
                        axis='y'
                        style={{ listStyle: 'none' }}
                    >
                        <AnimatePresence>{finishedIngredients}</AnimatePresence>
                    </Reorder.Group>
                    <motion.div layout='position' transition={{ duration: 0.3 }}>
                        <EditableIngredient item={state.editable} actionHandler={actionHandler} />
                    </motion.div>
                </LayoutGroup>
            </VStack>
        </VStack>
    );
}
