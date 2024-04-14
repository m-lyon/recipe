import * as CSS from 'csstype';
import { Textarea, useMergeRefs } from '@chakra-ui/react';
import { useEffect, useRef } from 'react';
import ResizeTextarea from 'react-textarea-autosize';

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
    lastInputRef: React.RefObject<HTMLTextAreaElement> | null;
    fontSize?: CSS.Property.FontSize;
    fontWeight?: CSS.Property.FontWeight;
}
export function EditableItemArea(props: Props) {
    const { lastInputRef } = props;
    const ref = useRef<HTMLTextAreaElement | null>(null);
    const refs = useMergeRefs(ref, props.lastInputRef);
    const handleSubmit = () => {
        // Reset the value to the default text when the field is empty, if last
        // in list, or remove item if not
        if (props.item.value.trim() === '') {
            if (!props.isLast) {
                props.removeFromList();
            } else {
                props.setValue('');
            }
        } else {
            if (!props.item.value.endsWith('.')) {
                props.setValue(props.item.value + '.');
            }
            if (props.isLast) {
                props.addNewEntry();
            }
        }
    };

    const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        props.setValue(e.target.value);
    };

    const handleEnter = (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            ref.current?.blur();
            if (lastInputRef && lastInputRef.current) {
                setTimeout(() => {
                    lastInputRef.current?.focus();
                }, 0);
            }
        }
    };

    useEffect(() => {
        if (ref.current) {
            ref.current.addEventListener('keydown', handleEnter);
        }

        return () => {
            if (ref.current) {
                ref.current.removeEventListener('keydown', handleEnter);
            }
        };
    }, []);

    return (
        <Textarea
            ref={refs}
            value={props.item.value}
            placeholder={props.defaultStr}
            onChange={onChange}
            fontSize={props.fontSize}
            fontWeight={props.fontWeight}
            onBlur={handleSubmit}
            as={ResizeTextarea}
            minRows={1}
            resize='none'
            minH='unset'
            border='none'
            px={0}
            pt={0}
            _focusVisible={{ outline: 'none' }}
        />
    );
}
