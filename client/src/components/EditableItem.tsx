import { Editable, EditablePreview, EditableInput, Box } from '@chakra-ui/react';
import { useRef, useEffect } from 'react';
import { forwardRef, useState } from 'react';

interface Item {
    value: string;
    isEdited: boolean;
}
interface Props {
    defaultStr: string;
    isLast: boolean;
    removeFromList: () => void;
    item: Item;
    setValue: (value: string) => void;
    addNewEntry: () => void;
    toggleIsEdited: () => void;
    handleEnter: (event: KeyboardEvent) => void;
}

export const EditableItem = forwardRef<HTMLInputElement, Props>(function EditableIngredient(
    {
        defaultStr,
        isLast,
        removeFromList,
        item,
        setValue,
        addNewEntry,
        toggleIsEdited,
        handleEnter,
    }: Props,
    ref
) {
    const inputRef = useRef(null);
    const wrapperRef = useRef(null);
    const [textWidth, setTextWidth] = useState(0);

    useEffect(() => {
        // Set the initial width given the default text
        const width = wrapperRef.current.getBoundingClientRect().width;
        console.log('initial width -> ', width);
        setTextWidth(width);
    }, []);

    const handleEdit = () => {
        if (!item.isEdited) {
            inputRef.current.setSelectionRange(0, 0);
        }
    };

    const handleChange = (value: string) => {
        if (!item.isEdited) {
            toggleIsEdited();
            setValue(value.replace(defaultStr, ''));
        } else {
            setValue(value);
        }
        if (item.isEdited) {
            const rectWidth = inputRef.current.getBoundingClientRect().width;
            const scrollWidth = inputRef.current.scrollWidth;
            const offsetWidth = wrapperRef.current.offsetWidth;
            console.log('editing width -> ', rectWidth, scrollWidth, offsetWidth);
        }
    };

    const handleSubmit = (value: string) => {
        // Reset the value to the default text when the field is empty, if last
        // in list, or remove item if not
        if (value.trim() === '') {
            if (isLast) {
                setValue(defaultStr);
                if (item.isEdited) {
                    toggleIsEdited();
                }
            } else {
                removeFromList();
            }
        } else {
            if (isLast && item.isEdited) {
                addNewEntry();
            }
        }
        setTimeout(() => {
            const width = wrapperRef.current.getBoundingClientRect().width;
            console.log('current width -> ', width);
            setTextWidth(width);
        }, 0);
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
            ref={wrapperRef}
            value={item.value}
            selectAllOnFocus={false}
            onEdit={handleEdit}
            onSubmit={handleSubmit}
            onChange={handleChange}
            textAlign='left'
        >
            <EditablePreview ref={ref} />
            <EditableInput
                ref={inputRef}
                value={item.value}
                _focusVisible={{ outline: 'none' }}
                width={textWidth}
            />
        </Editable>
    );
});
