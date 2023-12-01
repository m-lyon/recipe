import { LayoutGroup } from 'framer-motion';
import { GetIngredientOptsQuery } from '../../../../../__generated__/graphql';
import { DropdownItem } from '../../../../../components/DropdownItem';
import { MutableRefObject, FC } from 'react';
import { useNavigatableList } from '../../../hooks/useNavigatableList';
import { Popover, PopoverAnchor } from '@chakra-ui/react';
import { useRef } from 'react';
import { PopoverCloseButton, PopoverContent, PopoverArrow } from '@chakra-ui/react';
import { useDisclosure } from '@chakra-ui/react';
import FocusLock from 'react-focus-lock';

export interface Suggestion {
    value: string;
    colour?: string;
    _id: undefined;
}
interface Props {
    strValue: string;
    data: GetIngredientOptsQuery;
    setItem: (value: string | null, _id?: string) => void;
    setIsSelecting: (value: boolean) => void;
    filter: (data: GetIngredientOptsQuery, value: string) => Array<Suggestion>;
    handleSubmit?: () => void;
    inputRef: MutableRefObject<HTMLInputElement | null>;
    previewRef: MutableRefObject<HTMLDivElement | null>;
    AddNewForm: FC<{ firstFieldRef: MutableRefObject<HTMLInputElement | null> }>;
}
export function DropdownList(props: Props) {
    const {
        strValue,
        data,
        setItem,
        setIsSelecting,
        filter,
        handleSubmit,
        inputRef,
        previewRef,
        AddNewForm,
    } = props;
    const dropdownRef = useRef<HTMLDivElement | null>(null);
    const firstFieldRef = useRef<HTMLInputElement | null>(null);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const suggestions = filter(data, strValue);

    // previewRef is used here to ensure when the user clicks to select,
    // that the Editable component is refocused, this is because clicking on the
    // DropdownItem will blur the Editable component.

    const handleSelect = (item: Suggestion) => {
        // Handle skip
        if (item.value.startsWith('skip ')) {
            setItem(null);
            if (typeof handleSubmit !== 'undefined') {
                handleSubmit();
            }
            // Handle add new
        } else if (item.value.startsWith('add new ')) {
            console.log('add new called');
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
                        setIsSelecting={setIsSelecting}
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
                setIsSelecting={setIsSelecting}
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
            <PopoverContent p={5}>
                <FocusLock returnFocus>
                    <PopoverArrow />
                    <PopoverCloseButton />
                    <AddNewForm firstFieldRef={firstFieldRef} />
                </FocusLock>
            </PopoverContent>
        </Popover>
    );
}
