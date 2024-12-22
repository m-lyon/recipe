import { useShallow } from 'zustand/shallow';
import { useMutation } from '@apollo/client';
import { ChangeEvent, RefObject } from 'react';
import { AnimatePresence, LayoutGroup, Reorder, motion } from 'framer-motion';

import { DEBUG } from '@recipe/constants';
import { useRecipeStore } from '@recipe/stores';
import { useErrorToast } from '@recipe/common/hooks';
import { EditableText } from '@recipe/common/components';
import { DELETE_UNIT } from '@recipe/graphql/mutations/unit';
import { DELETE_PREP_METHOD } from '@recipe/graphql/mutations/prepMethod';
import { EditableIngredient, FinishedIngredient } from '@recipe/features/recipeIngredient';

interface Props {
    section: number;
    optionalRef: RefObject<HTMLInputElement> | null;
    handleOpen: (index: number) => void;
}
export function EditableIngredientSubsection(props: Props) {
    const { section, optionalRef, handleOpen } = props;
    const { removeFinished, setFinished, setTitle, finished, title, remove, add } = useRecipeStore(
        useShallow((state) => ({
            removeFinished: state.removeFinishedIngredient,
            setFinished: state.setFinishedIngredients,
            setTitle: state.setIngredientSectionName,
            finished: state.ingredientSections[section].finished,
            title: state.ingredientSections[section].name,
            remove: state.removeIngredientSection,
            add: state.addIngredientSection,
        }))
    );
    const isLastSection = useRecipeStore(
        (state) => section === state.ingredientSections.length - 1
    );
    const isPenultimateSection = useRecipeStore(
        (state) => section === state.ingredientSections.length - 2
    );
    const lastSectionHasName = useRecipeStore((state) => {
        const name = state.ingredientSections.at(-1)?.name;
        return name !== undefined && name?.trim() !== '';
    });
    const lastSectionHasIngredients = useRecipeStore(
        (state) => state.ingredientSections.at(-1)!.finished.length > 0
    );
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

    const finishedIngredients = finished.map(
        (item: FinishedRecipeIngredient, itemIndex: number) => {
            return (
                <FinishedIngredient
                    key={item.key}
                    item={item}
                    removeFinished={() => {
                        removeFinished(section, itemIndex);
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

    const onChange = (e: ChangeEvent<HTMLInputElement>) => {
        setTitle(section, e.target.value);
    };
    const onSubmit = () => {
        if (!isLastSection) {
            if (
                isPenultimateSection &&
                (!title || title.trim() === '') &&
                !lastSectionHasName &&
                !lastSectionHasIngredients
            ) {
                // Special case where the last subsection is empty and the penultimate
                // subsection title is removed. In this case, remove the last subsection.
                return remove(section + 1);
            }
            if (!title || title.trim() === '') {
                return handleOpen(section);
            }
        }
        if (title && title.trim() !== '' && lastSectionHasName) {
            add();
        }
    };

    return (
        <AnimatePresence>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <LayoutGroup>
                    <EditableText
                        placeholder='Enter Subsection'
                        value={title ?? ''}
                        onChange={onChange}
                        onSubmit={onSubmit}
                        placeholderColor='gray.400'
                        fontSize='2xl'
                        textAlign='left'
                        pb='8px'
                        optionalRef={optionalRef}
                        fontWeight={600}
                        aria-label={`Enter title for ingredient subsection ${section + 1}`}
                    />
                    <Reorder.Group
                        values={finished}
                        onReorder={(finished) => setFinished(section, finished)}
                        as='ul'
                        axis='y'
                        style={{ listStyle: 'none' }}
                    >
                        <AnimatePresence>{finishedIngredients}</AnimatePresence>
                    </Reorder.Group>
                    <motion.div layout='position' transition={{ duration: 0.3 }}>
                        <EditableIngredient section={section} />
                    </motion.div>
                </LayoutGroup>
            </motion.div>
        </AnimatePresence>
    );
}
