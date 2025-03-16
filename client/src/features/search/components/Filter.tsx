import { KeyboardEvent, useRef } from 'react';
import { Box, Input, useOutsideClick } from '@chakra-ui/react';

import { useDropdown } from '@recipe/common/hooks';
import { TagDropdown } from '@recipe/features/tags';

interface Props {
    value: string;
    setValue: (value: string) => void;
    placeholder: string;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    addItem: (item: FilterChoice) => void;
    suggestions: FilterChoice[];
}
export function Filter(props: Props) {
    const { value, setValue, placeholder, isOpen, setIsOpen, addItem, suggestions } = props;

    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    const { active, handleSetActive, handleKeyboardEvent } = useDropdown(suggestions, listRef);
    const onKeyDown = (e: KeyboardEvent) =>
        handleKeyboardEvent(e, (item) => {
            addItem(item);
            setIsOpen(false);
            if (inputRef.current) {
                inputRef.current.blur();
            }
        });

    useOutsideClick({
        ref: containerRef,
        handler: () => {
            if (isOpen) {
                setIsOpen(false);
            }
        },
    });

    return (
        <Box w='100%' position='relative' ref={containerRef}>
            <Input
                ref={inputRef}
                placeholder={placeholder}
                value={value}
                onChange={(e) => setValue(e.currentTarget.value)}
                onKeyDown={onKeyDown}
                onFocus={() => setIsOpen(true)}
                aria-label={placeholder}
                mb='1px'
            />
            <TagDropdown
                active={active}
                handleSetActive={handleSetActive}
                handleSelect={(item) => {
                    setIsOpen(false);
                    addItem(item);
                }}
                isOpen={isOpen}
                width='100%'
                suggestions={suggestions}
                listRef={listRef}
            />
        </Box>
    );
}
