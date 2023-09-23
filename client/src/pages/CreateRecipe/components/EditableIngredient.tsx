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
    // TODO: look at isSelecting, here it is used to ensure
    // when the user clicks to select, that handleSubmit doesnt
    // reset.
    const ingredientStr = actionHandler.get.string();

    const handleEdit = () => {
        if (!item.isEdited) {
            inputRef.current?.setSelectionRange(0, 0);
        }
    };

    const handleSubmit = () => {
        // This function ensures that when submit is called, the EditableIngredient is
        // rendered for the next item in the list, if the EditableIngredient was previously
        // in focus.

        if (!isComplete && !isSelecting) {
            console.log('resetter called');
            actionHandler.reset();
        } else {
            console.log('submit called');
            setTimeout(() => {
                previewRef.current?.focus();
            }, 0);
            setIsComplete(false);
        }
    };

    const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && inputRef.current) {
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
