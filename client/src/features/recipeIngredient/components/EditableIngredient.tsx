import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';

import { DEBUG } from '@recipe/constants';
import { useRecipeStore } from '@recipe/stores';
import { useErrorToast } from '@recipe/common/hooks';
import { DELETE_UNIT } from '@recipe/graphql/mutations/unit';
import { useUnitConversion } from '@recipe/features/servings';
import { GET_INGREDIENT_COMPONENTS } from '@recipe/graphql/queries/recipe';

import { EditableItem } from './EditableItem';
import { NewItemPopover } from './NewItemPopover';
import { getSuggestions } from '../utils/suggestions';

interface Props {
    section: number;
    fontSize?: string;
}
export function EditableIngredient(props: Props) {
    const { section, fontSize } = props;
    // ------------------ State ------------------
    const item = useRecipeStore((state) => state.ingredientSections[section].editable);
    const reset = useRecipeStore((state) => state.resetEditableIngredient);
    const open = useRecipeStore((state) => state.showIngredientDropdown);
    const numFinished = useRecipeStore(
        (state) => state.ingredientSections[section].finished.length
    );
    const setPopover = useRecipeStore((state) => state.setIngredientPopover);
    const deleteChar = useRecipeStore((state) => state.removeIngredientCharacter);
    const editableStr = useRecipeStore((state) => state.getIngredientString(section));
    const attributeStr = useRecipeStore((state) => state.getIngredientAttributeString(section));
    const setAttribute = useRecipeStore((state) => state.setEditableIngredientAttribute);
    const handleChange = useRecipeStore((state) => state.handleIngredientChange);
    const { data } = useQuery(GET_INGREDIENT_COMPONENTS);
    const { apply } = useUnitConversion();
    const [bespokeValue, setBespokeValue] = useState('');
    const toast = useErrorToast();
    const [deleteUnit] = useMutation(DELETE_UNIT, {
        onCompleted: (data) => {
            if (DEBUG) {
                console.log(`Successfully deleted unit ${data.unitRemoveById?.recordId}`);
            }
        },
        onError: (error) => {
            toast({
                title: 'Error saving unit',
                description: error.message,
                position: 'top',
            });
        },
        update(cache, { data }) {
            cache.evict({ id: `Unit:${data?.unitRemoveById?.recordId}` });
        },
    });
    const handleReset = () => {
        reset(section);
        if (item.unit.data && !item.unit.data.unique) {
            deleteUnit({ variables: { id: item.unit.data._id } });
        }
    };
    const openPopover = (type: PopoverType) => {
        if (type === 'bespokeUnit') {
            setBespokeValue(attributeStr);
        }
        setPopover(section, type);
    };

    return (
        <EditableItem
            item={item}
            text={editableStr}
            attributeText={attributeStr}
            suggestions={getSuggestions(item, data, attributeStr)}
            placeholder='Enter ingredient'
            previewLabel={`Enter ingredient #${numFinished + 1} for subsection ${section + 1}`}
            inputLabel={`Input ingredient #${numFinished + 1} for subsection ${section + 1}`}
            fontSize={fontSize}
            onEdit={() => open(section)}
            onChange={(value) => handleChange(section, value, data, apply)}
            setAttribute={(attr) => setAttribute(section, attr, data, apply)}
            deleteChar={() => deleteChar(section)}
            onReset={handleReset}
            openPopover={openPopover}
            closePopover={() => setPopover(section, null)}
            renderPopover={({ fieldRef, onClose, setItem }) => (
                <NewItemPopover
                    fieldRef={fieldRef}
                    onClose={onClose}
                    setItem={setItem}
                    item={item}
                    bespokeValue={bespokeValue}
                    setBespokeValue={setBespokeValue}
                />
            )}
        />
    );
}
