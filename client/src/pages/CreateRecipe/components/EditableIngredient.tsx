import { Editable, EditablePreview, EditableInput } from '@chakra-ui/react';
import { useRef, useEffect, useState } from 'react';
import { IngredientDropdown } from './IngredientDropdown';
import { Ingredient, IngredientActionHandler } from '../hooks/useIngredientList';

interface Props {
    item: Ingredient;
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
        // This function is triggered when Editable is blurred. Enter KeybaordEvent
        // does not trigger this due to event.preventDefault() in IngredientPropList.
        // This function only handles incomplete submissions, as complete submissions
        // are handled by the useEffect below.
        console.log('isComplete', isComplete, 'isSelecting', isSelecting);
        if (!isComplete && !isSelecting) {
            console.log('resetter called');
            actionHandler.reset();
        }
    };

    useEffect(() => {
        if (isComplete) {
            console.log('useEffect called', item.isEdited);
            // isComplete is changed to true when succesful submission occurs,
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

    const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && inputRef.current) {
            console.log('escape called');
            actionHandler.reset();
        }
    };

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.addEventListener('keydown', handleEscape);
        }

        return () => {
            if (inputRef.current) {
                // Cleanup: Remove the event listener when the component unmounts
                inputRef.current.removeEventListener('keydown', handleEscape);
            }
        };
    }, []);

    return (
        <>
            <Editable
                value={ingredientStr}
                selectAllOnFocus={false}
                onEdit={handleEdit}
                onSubmit={handleSubmit}
                onChange={actionHandler.handleChange}
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
                blurCallback={() => {
                    console.log('called blur');
                    setTimeout(() => {
                        inputRef.current?.blur();
                    }, 0);
                }}
                inputRef={inputRef}
                previewRef={previewRef}
                handleSubmit={actionHandler.handleSubmit}
                setIsComplete={setIsComplete}
            />
        </>
    );
}
