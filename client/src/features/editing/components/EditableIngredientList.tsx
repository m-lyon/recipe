import { Reorder } from 'framer-motion';
import { VStack } from '@chakra-ui/react';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';

import { FinishedRecipeIngredient } from '@recipe/types';
import { UseIngredientListReturnType } from '@recipe/features/recipeIngredient';
import { EditableIngredient, FinishedIngredient } from '@recipe/features/recipeIngredient';

export function EditableIngredientList(props: UseIngredientListReturnType) {
    const { state, actionHandler, queryData } = props;

    const finishedIngredients = state.finished.map(
        (item: FinishedRecipeIngredient, index: number) => {
            return (
                <FinishedIngredient
                    key={item.key}
                    index={index}
                    item={item}
                    removeFinished={actionHandler.removeFinished}
                />
            );
        }
    );

    return (
        <VStack spacing='0px' align='left'>
            <LayoutGroup>
                <Reorder.Group
                    values={state.finished}
                    onReorder={actionHandler.setFinishedArray}
                    as='ul'
                    axis='y'
                    style={{ listStyle: 'none' }}
                >
                    <AnimatePresence>{finishedIngredients}</AnimatePresence>
                </Reorder.Group>
                <motion.div layout='position' transition={{ duration: 0.3 }}>
                    <EditableIngredient
                        item={state.editable}
                        actionHandler={actionHandler}
                        queryData={queryData}
                    />
                </motion.div>
            </LayoutGroup>
        </VStack>
    );
}
