import { useRef } from 'react';
import { Reorder } from 'framer-motion';
import { VStack } from '@chakra-ui/react';
import { useMutation } from '@apollo/client';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';

import { DEBUG } from '@recipe/constants';
import { useErrorToast } from '@recipe/common/hooks';
import { DELETE_UNIT } from '@recipe/graphql/mutations/unit';
import { DELETE_PREP_METHOD } from '@recipe/graphql/mutations/prepMethod';
import { ConfirmDeleteAlert, EditableText } from '@recipe/common/components';
import { UseIngredientListReturnType } from '@recipe/features/recipeIngredient';
import { EditableIngredient, FinishedIngredient } from '@recipe/features/recipeIngredient';

import { useSubsectionDelete } from '../hooks/useSubsectionDelete';

export function EditableIngredientList(props: UseIngredientListReturnType) {
    const { state, actionHandler, queryData } = props;
    const ref = useRef<HTMLInputElement>(null);
    const { isOpen, handleOpen, handleConfirm, handleCancel, indexToDelete, returnFocus } =
        useSubsectionDelete();
    const errorToast = useErrorToast();
    const [deleteUnit] = useMutation(DELETE_UNIT, {
        onCompleted: (data) => {
            if (DEBUG) {
                console.log(`Successfully deleted unit ${data.unitRemoveById?.recordId}`);
            }
        },
        onError: (error) => {
            errorToast({
                title: 'Error deleting unit',
                description: error.message,
                position: 'top',
            });
        },
        update(cache, { data }) {
            cache.evict({ id: `Unit:${data?.unitRemoveById?.recordId}` });
        },
    });
    const [deletePrepMethod] = useMutation(DELETE_PREP_METHOD, {
        onCompleted: (data) => {
            if (DEBUG) {
                console.log(
                    `Successfully deleted prep method ${data.prepMethodRemoveById?.recordId}`
                );
            }
        },
        onError: (error) => {
            errorToast({
                title: 'Error deleting prep method',
                description: error.message,
                position: 'top',
            });
        },
        update(cache, { data }) {
            cache.evict({ id: `PrepMethod:${data?.prepMethodRemoveById?.recordId}` });
        },
    });

    const subsections = state.map((subsection, sectionIndex) => {
        const finishedIngredients = subsection.finished.map(
            (item: FinishedRecipeIngredient, itemIndex: number) => {
                return (
                    <FinishedIngredient
                        key={item.key}
                        item={item}
                        removeFinished={() => {
                            actionHandler.removeFinished(sectionIndex, itemIndex);
                            if (item.unit && !item.unit.unique) {
                                deleteUnit({ variables: { id: item.unit._id } });
                            }
                            if (item.prepMethod && !item.prepMethod.unique) {
                                deletePrepMethod({ variables: { id: item.prepMethod._id } });
                            }
                        }}
                    />
                );
            }
        );

        const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            actionHandler.subsection.setTitle(sectionIndex, e.target.value);
        };
        const onSubmit = () => {
            if (state.length > 1 && sectionIndex !== state.length - 1) {
                if (
                    sectionIndex === state.length - 2 &&
                    (!subsection.name || subsection.name.trim() === '') &&
                    (!state.at(-1)!.name || state.at(-1)!.name!.trim() === '') &&
                    state.at(-1)!.finished.length === 0
                ) {
                    // Special case where the last subsection is empty and the penultimate
                    // subsection title is removed. In this case, remove the last subsection.
                    return actionHandler.subsection.remove(sectionIndex + 1);
                }
                if (!subsection.name || subsection.name.trim() === '') {
                    return handleOpen(sectionIndex);
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
                        optionalRef={indexToDelete === sectionIndex ? ref : null}
                        fontWeight={600}
                        aria-label={`Enter title for ingredient subsection ${sectionIndex + 1}`}
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
                            ingredientNum={subsection.finished.length + 1}
                        />
                    </motion.div>
                </LayoutGroup>
            </motion.div>
        );
    });

    return (
        <VStack spacing='24px' align='left'>
            <AnimatePresence>{subsections}</AnimatePresence>
            <ConfirmDeleteAlert
                title='Delete Subsection'
                dialogText='Are you sure you want to delete this subsection and its contents?'
                isOpen={isOpen}
                onConfirm={() => handleConfirm(actionHandler.subsection.remove)}
                onCancel={handleCancel}
                finalFocusRef={ref}
                returnFocus={returnFocus}
            />
        </VStack>
    );
}
