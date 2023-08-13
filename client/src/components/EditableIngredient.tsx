import { Editable, EditablePreview, EditableInput } from '@chakra-ui/react';
import { useRef, useEffect, forwardRef, useState } from 'react';
import { MenuList } from './MenuList';
import { Ingredient, ActionHandler } from '../hooks/useIngredientList';
import { mergeRefs } from 'react-merge-refs';

const handleKeyDown = (event: any) => {
    // To stop entering from submitting
    if (event.key === 'Enter') {
        event.preventDefault();
        // Optionally, you can call handleSubmit here to manually trigger the submit action
    }
};

interface Props {
    item: Ingredient;
    actionHandler: ActionHandler;
    handleEnter: (event: KeyboardEvent) => void;
    fontSize?: string;
    color?: string;
}
export const EditableIngredient = forwardRef<HTMLInputElement, Props>(function EditableIngredient(
    { item, actionHandler, handleEnter, fontSize, color }: Props,
    ref
) {
    const previewRef = useRef<HTMLInputElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const ingredientStr = actionHandler.get.string();
    const [isSelecting, setIsSelecting] = useState<boolean>(false);

    const handleEdit = () => {
        if (!item.isEdited) {
            inputRef.current?.setSelectionRange(0, 0);
        }
    };

    const handleSubmit = (value: string) => {
        if (isSelecting) {
            setTimeout(() => {
                previewRef.current?.focus();
            }, 0);
        } else {
            console.log('value', value);
            actionHandler.handleSubmit(value);
            console.log('submitted');
        }
    };

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.addEventListener('keydown', handleEnter);
        }

        return () => {
            if (inputRef.current) {
                // Cleanup: Remove the event listener when the component unmounts
                inputRef.current.removeEventListener('keydown', handleEnter);
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
                color={color}
            >
                <EditablePreview ref={mergeRefs([previewRef, ref])} />
                <EditableInput
                    ref={inputRef}
                    value={ingredientStr}
                    _focusVisible={{ outline: 'none' }}
                    // onKeyDown={handleKeyDown}
                />
            </Editable>
            <MenuList
                inputState={item.state}
                show={item.show}
                setShow={actionHandler.set.show}
                currentValue={actionHandler.get.currentValue()}
                setValue={actionHandler.set.currentValue}
                setIsSelecting={setIsSelecting}
                blurCallback={() => {
                    console.log('called blur');
                    setTimeout(() => {
                        inputRef.current?.blur();
                    }, 0);
                }}
            />
        </>
    );
});
