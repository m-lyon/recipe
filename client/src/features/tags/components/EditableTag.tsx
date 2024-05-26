import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Editable, EditableInput, EditablePreview, useOutsideClick } from '@chakra-ui/react';

import { TagDropdown } from './TagDropdown';
import { FinishedTag } from '../hooks/useTagList';
import type { EditableTag } from '../hooks/useTagList';
import { DEFAULT_TAG_STR, EditableTagActionHandler } from '../hooks/useTagList';

interface Props {
    tag: EditableTag;
    actions: EditableTagActionHandler;
    tagStr: string;
    selectedTags: FinishedTag[];
}
export function EditableTag(props: Props) {
    const { tag, actions, tagStr, selectedTags } = props;
    const parentRef = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);
    useOutsideClick({
        ref: parentRef,
        handler: () => {
            if (tag.value !== null || tag.show) {
                actions.reset();
            }
        },
    });

    return (
        <motion.div layout='position' ref={parentRef}>
            <Editable
                value={tagStr}
                selectAllOnFocus={false}
                onEdit={() => !tag.show && actions.setShow('on')}
                onChange={actions.setValue}
                onCancel={actions.reset}
                textAlign='left'
                color={tag.value !== null ? '' : 'gray.400'}
                paddingLeft='6px'
                placeholder={DEFAULT_TAG_STR}
            >
                <EditablePreview />
                <EditableInput ref={inputRef} value={tagStr} _focusVisible={{ outline: 'none' }} />
            </Editable>
            <TagDropdown
                tag={tag}
                actions={actions}
                inputRef={inputRef}
                selectedTags={selectedTags}
            />
        </motion.div>
    );
}
