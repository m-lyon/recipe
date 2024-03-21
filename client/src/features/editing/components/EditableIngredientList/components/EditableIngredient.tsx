import { Editable, EditablePreview, EditableInput } from '@chakra-ui/react';
import { useOutsideClick } from '@chakra-ui/react';
import { useRef } from 'react';
import { RecipeIngredientDropdown } from './RecipeIngredientDropdown';
import { EditableRecipeIngredient as EditableIngredientType } from '../../../hooks/useIngredientList';
import { QueryData } from '../../../hooks/useIngredientList';
import { IngredientActionHandler, DEFAULT_INGREDIENT_STR } from '../../../hooks/useIngredientList';

interface Props {
    item: EditableIngredientType;
    actionHandler: IngredientActionHandler;
    queryData: QueryData;
    fontSize?: string;
}
export function EditableIngredient({ item, actionHandler, fontSize, queryData }: Props) {
    const previewRef = useRef<HTMLInputElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const parentRef = useRef<HTMLDivElement | null>(null);
    useOutsideClick({
        ref: parentRef,
        handler: () => {
            if (item.quantity !== null || item.show) {
                actionHandler.resetEditable();
            }
        },
    });

    const ingredientStr = actionHandler.editableStringValue();

    return (
        <div ref={parentRef}>
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
                        actionHandler.decrementEditableState();
                    }
                }}
                onChange={actionHandler.handleEditableChange}
                onCancel={actionHandler.resetEditable}
                onEdit={actionHandler.setEditableShow.on}
                textAlign='left'
                fontSize={fontSize}
                color={item.quantity !== null || item.ingredient.value !== null ? '' : 'gray.400'}
                paddingLeft='6px'
                placeholder={DEFAULT_INGREDIENT_STR}
            >
                <EditablePreview ref={previewRef} width={'100%'} placeholder='test' />
                <EditableInput
                    ref={inputRef}
                    value={ingredientStr}
                    _focusVisible={{ outline: 'none' }}
                />
            </Editable>
            <RecipeIngredientDropdown
                item={item}
                actionHandler={actionHandler}
                queryData={queryData}
                inputRef={inputRef}
                previewRef={previewRef}
            />
        </div>
    );
}
