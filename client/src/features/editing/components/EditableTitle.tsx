import { CentredTextArea } from '@recipe/common/components';

export interface EditableTitleProps {
    value: string;
    setTitle: (value: string) => void;
}

export function EditableTitle(props: EditableTitleProps) {
    const { value, setTitle } = props;
    return (
        <CentredTextArea
            value={value}
            setValue={setTitle}
            fontSize='3xl'
            placeholder='Enter Recipe Title'
            aria-label='Enter recipe title'
            fontWeight={600}
        />
    );
}
