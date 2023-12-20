import { Reorder } from 'framer-motion';
import { Box, VStack } from '@chakra-ui/react';
import { EditableIngredient } from './components/EditableIngredient';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { UseIngredientListReturnType } from '../../hooks/useIngredientList';
import { FinishedIngredient } from './components/FinishedIngredient';
import { FinishedIngredient as FinishedIngredientType } from '../../hooks/useIngredientList';

export function EditableIngredientList(props: UseIngredientListReturnType) {
    const { state, actionHandler, setFinished, removeFinished } = props;

    const finishedIngredients = state.finished.map(
        (item: FinishedIngredientType, index: number) => {
            return (
                <FinishedIngredient
                    key={item.key}
                    index={index}
                    item={item}
                    removeFinished={removeFinished}
                />
            );
        }
    );

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
