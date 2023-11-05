import { EditableTagActionHandler, EditableTag, DEFAULT_TAG_STR } from '../hooks/useTagList';
import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { TagDropdown } from './TagDropdown';
import { Editable, EditablePreview, EditableInput } from '@chakra-ui/react';

interface Props {
    tag: EditableTag;
    actions: EditableTagActionHandler;
    tagStr: string;
}
export function EditableTag(props: Props) {
    const { tag, actions, tagStr } = props;
    const [isSelecting, setIsSelecting] = useState<boolean>(false);
    const inputRef = useRef<HTMLInputElement | null>(null);

    const handleEdit = () => {
        if (!tag.isEdited) {
            inputRef.current?.setSelectionRange(0, 0);
            actions.setShow('on');
        }
    };

    const handleChange = (value: string) => {
        if (!tag.isEdited) {
            actions.setValue(value.replace(DEFAULT_TAG_STR, ''));
        } else {
            actions.setValue(value);
        }
    };

    const handleSubmit = () => {
        // This function is triggered when Editable is blurred. Enter KeyboardEvent
        // does not trigger this due to event.preventDefault() in IngredientDropdownList.
        // This function only handles incomplete submissions, as complete submissions
        // are handled by the useEffect below.
        if (!isSelecting) {
            actions.reset();
        }
    };

    return (
        <motion.div layout='position'>
            <Editable
                value={tagStr}
                selectAllOnFocus={false}
                onEdit={handleEdit}
                onSubmit={handleSubmit}
                onChange={handleChange}
                onCancel={actions.reset}
                textAlign='left'
                color={tag.isEdited ? '' : 'gray.400'}
                paddingLeft='6px'
            >
                <EditablePreview />
                <EditableInput ref={inputRef} value={tagStr} _focusVisible={{ outline: 'none' }} />
            </Editable>
            <TagDropdown
                tag={tag}
                actions={actions}
                inputRef={inputRef}
                setIsSelecting={setIsSelecting}
            />
        </motion.div>
    );
}
