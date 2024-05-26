import { MutableRefObject } from 'react';

import { DropdownItem } from '@recipe/common/components';
import { useNavigatableList } from '@recipe/common/hooks';

interface Props {
    strValue: string;
    setItem: (value: string | null, _id?: string) => void;
    inputRef: MutableRefObject<HTMLInputElement | null>;
    previewRef: MutableRefObject<HTMLDivElement | null>;
}
export function QuantityDropdownList(props: Props) {
    const { strValue, setItem, inputRef, previewRef } = props;
    const handleSkip = () => setItem(null);

    const { highlightedIndex, setHighlightedIndex } = useNavigatableList(
        ['skip quantity'],
        handleSkip,
        inputRef
    );

    return (
        strValue === '' && (
            <DropdownItem
                color='gray.400'
                value='skip quantity'
                onClick={() => {
                    handleSkip();
                    previewRef?.current?.focus();
                }}
                isHighlighted={highlightedIndex === 0}
                setHighlighted={() => setHighlightedIndex(0)}
                resetHighlighted={() => setHighlightedIndex(-1)}
            />
        )
    );
}
