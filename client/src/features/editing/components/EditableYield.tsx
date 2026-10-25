import { useQuery } from '@apollo/client';
import { useShallow } from 'zustand/shallow';
import { Tag, TagCloseButton, TagLabel, VStack, Wrap } from '@chakra-ui/react';

import { useRecipeStore } from '@recipe/stores';
import { getYieldRowStr } from '@recipe/utils/formatting';
import { useUnitConversion } from '@recipe/features/servings';
import { GET_INGREDIENT_COMPONENTS } from '@recipe/graphql/queries/recipe';
import { EditableItem, getYieldSuggestions } from '@recipe/features/recipeIngredient';

function yieldKey(unit: UnitChoice): string {
    return unit.dimension === 'count' ? unit._id : unit.dimension;
}

export function EditableYield() {
    const { rows, item, title, pluralTitle, removeRow } = useRecipeStore(
        useShallow((state) => ({
            rows: state.yieldRows,
            item: state.yieldEditable,
            title: state.title,
            pluralTitle: state.pluralTitle,
            removeRow: state.removeYieldRow,
        }))
    );
    const text = useRecipeStore((state) => state.getYieldString());
    const attributeText = useRecipeStore((state) => state.getYieldAttributeString());
    const open = useRecipeStore((state) => state.showYieldDropdown);
    const reset = useRecipeStore((state) => state.resetEditableYield);
    const deleteChar = useRecipeStore((state) => state.removeYieldCharacter);
    const setAttribute = useRecipeStore((state) => state.setEditableYieldAttribute);
    const handleChange = useRecipeStore((state) => state.handleYieldChange);
    const { data } = useQuery(GET_INGREDIENT_COMPONENTS);
    const { apply } = useUnitConversion();

    const taken = new Set(rows.flatMap((row) => (row.unit ? [yieldKey(row.unit)] : [])));
    const choices = (data?.units ?? []).filter((unit) => !taken.has(yieldKey(unit)));
    const components = data && { ...data, units: choices };

    return (
        <VStack align='stretch' spacing={2} aria-label='Recipe yield'>
            {rows.length > 0 && (
                <Wrap spacing='5px'>
                    {rows.map((row, index) => {
                        const rowText = getYieldRowStr(row.quantity, row.unit, title, pluralTitle);
                        return (
                            <Tag key={row.unit?._id ?? index} size='lg' aria-label={rowText}>
                                <TagLabel py={1} lineHeight={1.3}>
                                    {rowText}
                                </TagLabel>
                                <TagCloseButton
                                    onClick={() => removeRow(index)}
                                    aria-label={`Remove ${rowText}`}
                                />
                            </Tag>
                        );
                    })}
                </Wrap>
            )}
            {choices.length > 0 && (
                <EditableItem
                    item={item}
                    text={text}
                    attributeText={attributeText}
                    suggestions={getYieldSuggestions(item, choices, attributeText)}
                    placeholder='Enter yield'
                    previewLabel='Enter yield'
                    inputLabel='Input yield'
                    onEdit={open}
                    onChange={(value) => handleChange(value, components, apply)}
                    setAttribute={(attr) => setAttribute(attr, components, apply)}
                    deleteChar={deleteChar}
                    onReset={reset}
                />
            )}
        </VStack>
    );
}
