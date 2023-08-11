import { Editable, EditablePreview, EditableInput, useBoolean } from '@chakra-ui/react';
import { useRef, useEffect, forwardRef, useState } from 'react';
import { MenuList } from './MenuList';
import { useIngredientHandler } from '../hooks/useIngredientHandler';
import { Ingredient, ActionHandler } from '../hooks/useIngredientList';

const handleKeyDown = (event: any) => {
    // To stop entering from submitting
    if (event.key === 'Enter') {
        event.preventDefault();
        // Optionally, you can call handleSubmit here to manually trigger the submit action
    }
};

interface Props {
    defaultStr: string;
    isLast: boolean;
    item: Ingredient;
    actionHandler: ActionHandler;
    handleEnter: (event: KeyboardEvent) => void;
    fontSize?: string;
    color?: string;
}
export const EditableIngredient = forwardRef<HTMLInputElement, Props>(function EditableIngredient(
    { defaultStr, isLast, item, actionHandler, handleEnter, fontSize, color }: Props,
    ref
) {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [show, setShow] = useBoolean(false);
    const [selection, setSelection] = useState<string | null>(null);
    const { getIngredientStr, handleChange, handleSubmit } = useIngredientHandler(defaultStr);
    const ingredientStr = getIngredientStr(item);

    const handleEdit = () => {
        if (!item.isEdited) {
            inputRef.current?.setSelectionRange(0, 0);
            setShow.on();
        }
    };

    // const handleSubmit = (value: string) => {
    //     // Reset the value to the default text when the field is empty, if last
    //     // in list, or remove item if not
    //     if (value.trim() === '') {
    //         if (isLast) {
    //             setValue(defaultStr);
    //             if (item.isEdited) {
    //                 actionHandler.toggleEdited();
    //             }
    //         } else {
    //             actionHandler.remove();
    //         }
    //     } else {
    //         if (isLast && item.isEdited) {
    //             actionHandler.addEmpty();
    //         }
    //     }
    //     if (selection !== null) {
    //         setValue(selection);
    //     }
    //     if (show) {
    //         setShow.off();
    //     }
    // };

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
                onSubmit={(value: string) => handleSubmit(value, item, actionHandler)}
                onChange={(value: string) => handleChange(value, item, actionHandler)}
                textAlign='left'
                fontSize={fontSize}
                color={color}
            >
                <EditablePreview ref={ref} />
                <EditableInput
                    ref={inputRef}
                    value={ingredientStr}
                    _focusVisible={{ outline: 'none' }}
                    // onKeyDown={handleKeyDown}
                />
            </Editable>
            {/* <MenuList
                parentValue={item.value.replace(defaultStr, '')}
                show={show}
                setShow={setShow}
                setValue={setValue}
                setSelection={setSelection}
            /> */}
        </>
    );
});
