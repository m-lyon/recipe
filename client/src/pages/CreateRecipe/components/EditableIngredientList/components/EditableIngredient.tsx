import { Editable, EditablePreview, EditableInput } from '@chakra-ui/react';
import { useRef, useEffect, useState } from 'react';
import { IngredientDropdown } from './IngredientDropdown';
import { EditableIngredient, IngredientActionHandler } from '../../../hooks/useIngredientList';

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

    const handleEdit = () => {
        if (!item.isEdited) {
            inputRef.current?.setSelectionRange(0, 0);
        }
    };

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
            // Below ensures that the cursor is at the start of the input, which will
            // not be the case if user submits via Enter KeyboardEvent, as handleEdit
            // Will not be triggered in this instance.
            if (!item.isEdited) {
                inputRef.current?.setSelectionRange(0, 0);
            }
            setIsComplete(false);
        }
    }, [isComplete]);

    return (
        <>
            <Editable
                value={ingredientStr}
                selectAllOnFocus={false}
                onEdit={handleEdit}
                onSubmit={handleSubmit}
                onChange={actionHandler.handleChange}
                onCancel={actionHandler.reset}
                textAlign='left'
                fontSize={fontSize}
                color={item.isEdited ? '' : 'gray.400'}
                paddingLeft='6px'
            >
                <EditablePreview ref={previewRef} />
                <EditableInput
                    ref={inputRef}
                    value={ingredientStr}
                    _focusVisible={{ outline: 'none' }}
                />
            </Editable>
            <IngredientDropdown
                inputState={item.state}
                show={item.show}
                setShow={actionHandler.set.show}
                currentValue={actionHandler.get.currentStateValue()}
                setItem={actionHandler.set.currentStateItem}
                setIsSelecting={setIsSelecting}
                inputRef={inputRef}
                previewRef={previewRef}
                handleSubmit={actionHandler.handleSubmit}
                setIsComplete={setIsComplete}
            />
        </>
    );
}
