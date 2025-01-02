import { useRef } from 'react';
import { motion } from 'framer-motion';
import { useShallow } from 'zustand/shallow';
import { Editable, EditableInput, EditablePreview, useOutsideClick } from '@chakra-ui/react';

import { useRecipeStore } from '@recipe/stores';
import { useWarningToast } from '@recipe/common/hooks';

import { TagDropdown } from './TagDropdown';
import { useTagDropdown } from '../hooks/useTagDropdown';

const FORBIDDEN_TAGS = ['vegan', 'vegetarian'];

export function EditableTag() {
    const parentRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLUListElement>(null);
    const toast = useWarningToast();
    const { tag, reset, dropdownIsOpen, showDropdown, setTag } = useRecipeStore(
        useShallow((state) => ({
            tag: state.editableTag,
            reset: state.resetEditableTag,
            dropdownIsOpen: state.tagsDropdownIsOpen,
            showDropdown: state.showTagsDropdown,
            setTag: state.setTag,
        }))
    );
    useOutsideClick({
        ref: parentRef,
        handler: () => {
            if (tag || dropdownIsOpen) {
                reset();
            }
        },
    });
    const { onKeyDown, ...dropdownProps } = useTagDropdown(listRef, inputRef);

    return (
        <motion.div layout='position' ref={parentRef}>
            <Editable
                value={tag}
                selectAllOnFocus={false}
                onEdit={() => !dropdownIsOpen && showDropdown()}
                onChange={(value: string) => {
                    if (FORBIDDEN_TAGS.includes(value.toLowerCase())) {
                        return toast({
                            title: 'Forbidden tag',
                            description: `${value} tag is automatically determined from ingredients.`,
                            position: 'top',
                        });
                    }
                    setTag(value);
                }}
                onCancel={reset}
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
            </Editable>
            <TagDropdown {...dropdownProps} listRef={listRef} />
        </motion.div>
    );
}
