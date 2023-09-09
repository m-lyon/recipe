import { Box, VStack } from '@chakra-ui/react';
import { EditableIngredient } from './EditableIngredient';
import { Ingredient, getIngredientStr } from '../hooks/useIngredientList';
import { UseIngredientListReturnType } from '../hooks/useIngredientList';
import { Reorder } from 'framer-motion';
import { Tag, TagLabel, TagCloseButton } from '@chakra-ui/react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';

export function EditableIngredientList(props: UseIngredientListReturnType) {
    const { state, actionHandler, setFinished, removeFinished } = props;

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
                        <AnimatePresence>
                            {state.finished.map((item: Ingredient, index: number) => {
                                const ingrStr = getIngredientStr(item);
                                return (
                                    <Reorder.Item
                                        key={item.key}
                                        value={item}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                    >
                                        <Tag size='lg' marginBottom='5px'>
                                            <TagLabel>{ingrStr}</TagLabel>
                                            <TagCloseButton onClick={() => removeFinished(index)} />
                                        </Tag>
                                    </Reorder.Item>
                                );
                            })}
                        </AnimatePresence>
                    </Reorder.Group>
                    <motion.div layout='position' transition={{ duration: 0.3 }}>
                        <EditableIngredient item={state.editable} actionHandler={actionHandler} />
                    </motion.div>
                </LayoutGroup>
            </VStack>
        </VStack>
    );
}
