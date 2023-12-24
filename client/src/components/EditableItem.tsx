import { Editable, EditablePreview, EditableInput } from '@chakra-ui/react';
import { useRef, useEffect } from 'react';
import { forwardRef } from 'react';

interface Item {
    value: string;
}
interface Props {
    defaultStr: string;
    isLast: boolean;
    removeFromList: () => void;
    item: Item;
    setValue: (value: string) => void;
    addNewEntry: () => void;
    handleEnter: (event: KeyboardEvent) => void;
    fontSize?: string;
}

export const EditableItem = forwardRef<HTMLInputElement, Props>(function EditableIngredient(
    {
        defaultStr,
        isLast,
        removeFromList,
        item,
        setValue,
        addNewEntry,
        handleEnter,
        fontSize,
    }: Props,
    ref
) {
    const inputRef = useRef<HTMLInputElement | null>(null);

    const handleSubmit = (value: string) => {
        // Reset the value to the default text when the field is empty, if last
        // in list, or remove item if not
        if (value.trim() === '') {
            if (!isLast) {
                removeFromList();
            }
        } else if (isLast) {
            addNewEntry();
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
        <Editable
            value={item.value}
            selectAllOnFocus={false}
            onSubmit={handleSubmit}
            onChange={setValue}
            textAlign='left'
            fontSize={fontSize}
            placeholder={defaultStr}
        >
            <EditablePreview
                ref={ref}
                display={'inline'}
                paddingTop={'0px'}
                verticalAlign={'top'}
            />
            <EditableInput
                ref={inputRef}
                value={item.value}
                _focusVisible={{ outline: 'none' }}
                display={'inline'}
            />
        </Editable>
    );
});
