import { Editable, EditablePreview, EditableInput } from '@chakra-ui/react';
import { useRef, useEffect, useState } from 'react';
import { MenuList } from './MenuList';
import { Ingredient, EditableActionHandler } from '../hooks/useIngredientList';

const handleKeyDown = (event: any) => {
    // To stop entering from submitting
    if (event.key === 'Enter') {
        event.preventDefault();
        // Optionally, you can call handleSubmit here to manually trigger the submit action
    }
};

interface Props {
    item: Ingredient;
    actionHandler: EditableActionHandler;
    fontSize?: string;
}
export function EditableIngredient({ item, actionHandler, fontSize }: Props) {
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
            actionHandler.handleSubmit(value);
        }
    };

    const handleEnter = (event: KeyboardEvent) => {
        if (event.key === 'Enter' && previewRef.current) {
            setTimeout(() => {
                previewRef.current?.focus();
            }, 0);
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
                color={item.isEdited ? '' : 'gray.400'}
                paddingLeft='6px'
            >
                <EditablePreview ref={previewRef} />
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
                currentValue={actionHandler.get.currentStateValue()}
                setValue={actionHandler.set.currentStateValue}
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
}
