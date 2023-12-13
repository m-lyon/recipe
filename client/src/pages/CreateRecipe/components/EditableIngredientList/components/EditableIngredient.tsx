import { Editable, EditablePreview, EditableInput } from '@chakra-ui/react';
import { useRef, useEffect, useState } from 'react';
import { IngredientDropdown } from './IngredientDropdown';
import { EditableIngredient, IngredientActionHandler } from '../../../hooks/useIngredientList';
import { DEFAULT_INGREDIENT_STR } from '../../../hooks/useIngredientList';

interface Props {
    item: EditableIngredient;
    actionHandler: IngredientActionHandler;
    fontSize?: string;
}
export function EditableIngredient({ item, actionHandler, fontSize }: Props) {
    const previewRef = useRef<HTMLInputElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [isSelecting, setIsSelecting] = useState<boolean>(false);
    const [isComplete, setIsComplete] = useState<boolean>(false);

    const ingredientStr = actionHandler.get.string();

    const handleSubmit = () => {
        // This function is triggered when Editable is blurred. Enter KeyboardEvent
        // does not trigger this due to event.preventDefault() in IngredientDropdownList.
        // This function only handles incomplete submissions, as complete submissions
        // are handled by the useEffect below.
        if (!isComplete && !isSelecting) {
            actionHandler.reset();
        }
    };

    useEffect(() => {
        if (isComplete) {
            // isComplete is set to true when succesful submission occurs,
            // therefore the next Editable component is focused via this useEffect.
            // We use a useEffect here to ensure that the previewRef is focused after
            // the submit event has been handled.
            previewRef.current?.focus();
            setIsComplete(false);
        }
    }, [isComplete]);

    actionHandler.set.currentStateItem;

    return (
        <>
            <Editable
                value={ingredientStr}
                onMouseDown={(e) => {
                    if (item.quantity !== null) {
                        e.preventDefault();
                    }
                }}
                selectAllOnFocus={false}
                onSubmit={handleSubmit}
                onChange={actionHandler.handleChange}
                onCancel={actionHandler.reset}
                textAlign='left'
                fontSize={fontSize}
                color={item.quantity !== null ? '' : 'gray.400'}
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
            <IngredientDropdown
                item={item}
                actionHandler={actionHandler}
                setIsSelecting={setIsSelecting}
                setIsComplete={setIsComplete}
                inputRef={inputRef}
                previewRef={previewRef}
            />
        </>
    );
}
