import { useRef } from 'react';
import { useClickAway } from 'react-use';
import { useShallow } from 'zustand/shallow';
import { Box, Editable } from '@chakra-ui/react';

import { useRecipeStore } from '@recipe/stores';
import { useWarningToast } from '@recipe/common/hooks';
import { IngredientTags, ReservedTags } from '@recipe/graphql/enums';

import { TagDropdown } from './TagDropdown';
import { useTagDropdown } from '../hooks/useTagDropdown';

export function EditableTag() {
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLUListElement>(null);
    const toast = useWarningToast();
    const { tag, reset, dropdownIsOpen, showDropdown, setTag, isOpen } = useRecipeStore(
        useShallow((state) => ({
            tag: state.editableTag,
            reset: state.resetEditableTag,
            dropdownIsOpen: state.tagsDropdownIsOpen,
            showDropdown: state.showTagsDropdown,
            setTag: state.setTag,
            isOpen: state.tagsDropdownIsOpen,
        }))
    );
    useClickAway(containerRef, () => {
        if (tag || dropdownIsOpen) {
            reset();
        }
    });
    const { onKeyDown, ...dropdownProps } = useTagDropdown(listRef, inputRef);

    return (
        <Box ref={containerRef} position='relative'>
            <Editable.Root
                value={tag}
                placeholder='Add a tag...'
                onValueChange={(details) => {
                    const value = details.value;
                    if (
                        Object.values(IngredientTags).includes(
                            value.toLowerCase() as IngredientTags
                        )
                    ) {
                        return toast({
                            title: 'Reserved tag',
                            description: `${value} tag is automatically determined from ingredients.`,
                            position: 'top',
                        });
                    }
                    if (Object.values(ReservedTags).includes(value.toLowerCase() as ReservedTags)) {
                        return toast({
                            title: 'Reserved tag',
                            description: `${value} is a reserved tag.`,
                            position: 'top',
                        });
                    }
                    setTag(value);
                }}
                selectOnFocus={false}
                textAlign='left'
                color={tag ? '' : 'gray.400'}
                paddingLeft='6px'
            >
                <Editable.Preview aria-label='Add a tag' />
                <Editable.Input
                    ref={inputRef}
                    _focusVisible={{ outline: 'none' }}
                    onKeyDown={onKeyDown}
                />
            </Editable.Root>
            <TagDropdown isOpen={isOpen} {...dropdownProps} listRef={listRef} />
        </Box>
    );
}
