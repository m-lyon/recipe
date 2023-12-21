import { LayoutGroup } from 'framer-motion';
import { DropdownItem } from '../../../../../components/DropdownItem';
import { MutableRefObject, FC } from 'react';
import { useNavigatableList } from '../../../hooks/useNavigatableList';
import { Popover, PopoverAnchor } from '@chakra-ui/react';
import { useRef } from 'react';
import { useDisclosure } from '@chakra-ui/react';
import { Suggestion, NewFormProps } from '../../../types';

interface Props<T> {
    strValue: string;
    data: T;
    setItem: (value: string | null, _id?: string) => void;
    filter: (data: T, value: string) => Array<Suggestion>;
    handleSubmit?: () => void;
    inputRef: MutableRefObject<HTMLInputElement | null>;
    previewRef: MutableRefObject<HTMLDivElement | null>;
    AddNewPopover: FC<NewFormProps>;
}
export function DropdownList<T>(props: Props<T>) {
    const { strValue, data, setItem, filter, handleSubmit, inputRef, previewRef, AddNewPopover } =
        props;
    const dropdownRef = useRef<HTMLDivElement | null>(null);
    const firstFieldRef = useRef<HTMLInputElement | null>(null);
    const { isOpen, onOpen, onClose } = useDisclosure({
        onClose: () => {
            previewRef.current?.focus();
        },
    });
    const suggestions = filter(data, strValue);

    // previewRef is used here to ensure when the user clicks to select,
    // that the Editable component is refocused, this is because clicking on the
    // DropdownItem will blur the Editable component.

    const handleSelect = (item: Suggestion) => {
        if (item.value.startsWith('skip ')) {
            setItem(null);
            if (typeof handleSubmit !== 'undefined') {
                handleSubmit();
            }
        } else if (item.value.startsWith('add new ')) {
            onOpen();
        } else {
            setItem(item.value, item._id);
            if (typeof handleSubmit !== 'undefined') {
                handleSubmit();
            }
        }
    };

    const { highlightedIndex, setHighlightedIndex } = useNavigatableList<Suggestion>(
        suggestions,
        handleSelect,
        inputRef
    );

    const listItems = suggestions.map((item, index) => {
        if (item.value.startsWith('add new ')) {
            return (
                <PopoverAnchor key={index}>
                    <DropdownItem
                        key={index}
                        color={item.colour}
                        value={item.value}
                        onClick={() => {
                            handleSelect(item);
                            previewRef?.current?.focus();
                        }}
                        isHighlighted={index === highlightedIndex}
                        setHighlighted={() => setHighlightedIndex(index)}
                        resetHighlighted={() => setHighlightedIndex(-1)}
                        ref={dropdownRef}
                    />
                </PopoverAnchor>
            );
        }
        return (
            <DropdownItem
                key={index}
                color={item.colour}
                value={item.value}
                onClick={() => {
                    handleSelect(item);
                    previewRef?.current?.focus();
                }}
                isHighlighted={index === highlightedIndex}
                setHighlighted={() => setHighlightedIndex(index)}
                resetHighlighted={() => setHighlightedIndex(-1)}
            />
        );
    });

    return (
        <Popover
            isOpen={isOpen}
            onOpen={onOpen}
            onClose={onClose}
            closeOnBlur={false}
            placement='right'
            initialFocusRef={firstFieldRef}
            returnFocusOnClose={true}
        >
            <LayoutGroup>{listItems}</LayoutGroup>
            <AddNewPopover
                firstFieldRef={firstFieldRef}
                onClose={onClose}
                handleSelect={handleSelect}
            />
        </Popover>
    );
}
