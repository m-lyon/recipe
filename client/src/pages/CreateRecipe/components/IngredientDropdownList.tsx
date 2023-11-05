import { LayoutGroup } from 'framer-motion';
import { GetIngredientOptsQuery } from '../../../__generated__/graphql';
import { DropdownItem } from '../../../components/DropdownItem';
import { MutableRefObject } from 'react';
import { useNavigatableList } from '../hooks/useNavigatableList';

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
}
export function IngredientDropdownList(props: Props) {
    const { strValue, data, setItem, setIsSelecting, filter, handleSubmit, inputRef, previewRef } =
        props;
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
            setItem(null); // TODO
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
            />
        );
    });

    return <LayoutGroup>{listItems}</LayoutGroup>;
}
