import { useRef } from 'react';
import { useClickAway } from 'react-use';
import { Box, Editable, EditableInput, EditablePreview } from '@chakra-ui/react';

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
    const tag = useRecipeStore((state) => state.editableTag);
    const reset = useRecipeStore((state) => state.resetEditableTag);
    const setTag = useRecipeStore((state) => state.setTag);
    const dropdownOpen = useRecipeStore((state) => state.tagsDropdownIsOpen);
    const showDropdown = useRecipeStore((state) => state.showTagsDropdown);
    const open = useRecipeStore((state) => state.tagsDropdownIsOpen);

    useClickAway(containerRef, () => {
        if (tag || dropdownOpen) {
            reset();
        }
    });
    const { onKeyDown, ...dropdownProps } = useTagDropdown(listRef, inputRef);

    return (
        <Box ref={containerRef} position='relative'>
            <Editable.Root
                value={tag}
                selectOnFocus={false}
                onEditChange={(details) => details.edit && !dropdownOpen && showDropdown()}
                onValueChange={(details) => {
                    if (
                        Object.values(IngredientTags).includes(
                            details.value.toLowerCase() as IngredientTags
                        )
                    ) {
                        return toast({
                            title: 'Reserved tag',
                            description: `${details.value} tag is automatically determined from ingredients.`,
                            position: 'top',
                        });
                    }
                    if (
                        Object.values(ReservedTags).includes(
                            details.value.toLowerCase() as ReservedTags
                        )
                    ) {
                        return toast({
                            title: 'Reserved tag',
                            description: `${details.value} is a reserved tag.`,
                            position: 'top',
                        });
                    }
                    setTag(details.value);
                }}
                onInteractOutside={reset}
                textAlign='left'
                color={tag ? '' : 'gray.400'}
                paddingLeft='6px'
                placeholder='Add a tag...'
            >
                <EditablePreview aria-label='Add a tag' />
                <EditableInput
                    ref={inputRef}
                    value={tag}
                    _focusVisible={{ outline: 'none' }}
                    onKeyDown={onKeyDown}
                />
            </Editable.Root>
            <TagDropdown open={open} {...dropdownProps} listRef={listRef} />
        </Box>
    );
}
