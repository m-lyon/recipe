import { useRef } from 'react';
import { useOutsideClick } from '@chakra-ui/react';
import { Box, Editable, EditableInput, EditablePreview } from '@chakra-ui/react';

import { EditableRecipeIngredient } from '@recipe/types';
import { RecipeIngredientQueryData } from '@recipe/types';

import { RecipeIngredientDropdown } from './RecipeIngredientDropdown';
import { DEFAULT_INGREDIENT_STR, IngredientActionHandler } from '../hooks/useIngredientList';

interface Props {
    subsection: number;
    item: EditableRecipeIngredient;
    actionHandler: IngredientActionHandler;
    queryData: RecipeIngredientQueryData;
    ingredientNum: number;
    fontSize?: string;
}
export function EditableIngredient(props: Props) {
    const { subsection, item, actionHandler, queryData, ingredientNum, fontSize } = props;
    const previewRef = useRef<HTMLInputElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const parentRef = useRef<HTMLDivElement | null>(null);
    useOutsideClick({
        ref: parentRef,
        handler: () => {
            if (item.quantity !== null || item.show) {
                actionHandler.resetEditable(subsection);
            }
        },
    });

    const ingredientStr = actionHandler.editableStringValue(subsection);

    return (
        // Position relative is needed for the dropdown to be positioned correctly
        <Box ref={parentRef} position='relative'>
            <Editable
                value={ingredientStr}
                onMouseDown={(e) => {
                    if (item.quantity !== null) {
                        e.preventDefault();
                        previewRef.current?.focus();
                    }
                }}
                selectAllOnFocus={false}
                onKeyDown={(e) => {
                    if (
                        e.key === 'Backspace' &&
                        ingredientStr === '' &&
                        item.state !== 'quantity'
                    ) {
                        actionHandler.decrementEditableState(subsection);
                    }
                }}
                onChange={(value: string) => actionHandler.handleEditableChange(subsection, value)}
                onCancel={() => actionHandler.resetEditable(subsection)}
                onEdit={() => actionHandler.setEditableShow.on(subsection)}
                textAlign='left'
                fontSize={fontSize}
                color={item.quantity !== null || item.ingredient.value !== null ? '' : 'gray.400'}
                pl='0px'
                placeholder={DEFAULT_INGREDIENT_STR}
            >
                <EditablePreview
                    ref={previewRef}
                    width='100%'
                    aria-label={`Enter ingredient #${ingredientNum} for subsection ${subsection + 1}`}
                />
                <EditableInput
                    ref={inputRef}
                    value={ingredientStr}
                    _focusVisible={{ outline: 'none' }}
                />
            </Editable>
            <RecipeIngredientDropdown
                subsection={subsection}
                item={item}
                actionHandler={actionHandler}
                queryData={queryData}
                inputRef={inputRef}
                previewRef={previewRef}
            />
        </Box>
    );
}
