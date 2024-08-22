import { Reorder } from 'framer-motion';
import { VStack } from '@chakra-ui/react';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';

import { FinishedRecipeIngredient } from '@recipe/types';
import { EditableText } from '@recipe/common/components';
import { UseIngredientListReturnType } from '@recipe/features/recipeIngredient';
import { EditableIngredient, FinishedIngredient } from '@recipe/features/recipeIngredient';

export function EditableIngredientList(props: UseIngredientListReturnType) {
    const { state, actionHandler, queryData } = props;

    const subsections = state.map((subsection, sectionIndex) => {
        const finishedIngredients = subsection.finished.map(
            (item: FinishedRecipeIngredient, itemIndex: number) => {
                return (
                    <FinishedIngredient
                        key={item.key}
                        index={itemIndex}
                        item={item}
                        removeFinished={() => actionHandler.removeFinished(sectionIndex, itemIndex)}
                    />
                );
            }
        );

        const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            actionHandler.subsection.setTitle(sectionIndex, e.target.value);
        };
        const onSubmit = () => {
            if (state.length > 1 && sectionIndex !== state.length - 1) {
                if (!subsection.name || subsection.name.trim() === '') {
                    actionHandler.subsection.remove(sectionIndex);
                }
            }
            if (
                subsection.name &&
                subsection.name.trim() !== '' &&
                state.at(-1)?.name &&
                state.at(-1)?.name?.trim() !== ''
            ) {
                actionHandler.subsection.add();
            }
        };

        return (
            <motion.div
                key={sectionIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <LayoutGroup>
                    <EditableText
                        placeholder='Enter Subsection'
                        value={subsection.name ?? ''}
                        onChange={onChange}
                        onSubmit={onSubmit}
                        fontSize='2xl'
                        textAlign='left'
                        pb='8px'
                        fontWeight={600}
                    />
                    <Reorder.Group
                        values={subsection.finished}
                        onReorder={(finished) =>
                            actionHandler.setFinishedArray(sectionIndex, finished)
                        }
                        as='ul'
                        axis='y'
                        style={{ listStyle: 'none' }}
                    >
                        <AnimatePresence>{finishedIngredients}</AnimatePresence>
                    </Reorder.Group>
                    <motion.div layout='position' transition={{ duration: 0.3 }}>
                        <EditableIngredient
                            subsection={sectionIndex}
                            item={subsection.editable}
                            actionHandler={actionHandler}
                            queryData={queryData}
                        />
                    </motion.div>
                </LayoutGroup>
            </motion.div>
        );
    });

    return (
        <VStack spacing='24px' align='left'>
            <AnimatePresence>{subsections}</AnimatePresence>
        </VStack>
    );
}
