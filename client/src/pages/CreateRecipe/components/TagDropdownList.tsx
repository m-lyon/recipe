import { LayoutGroup } from 'framer-motion';
import { Tag } from '../../../__generated__/graphql';
import { DropdownItem } from '../../../components/DropdownItem';
import { MutableRefObject } from 'react';
import { useNavigatableList } from '../hooks/useNavigatableList';
import { matchSorter } from 'match-sorter';

export interface Suggestion {
    value: string;
    colour?: string;
    _id: undefined;
}
interface Props {
    strValue: string;
    tags: Tag[];
    setAndSubmit: (value: string, _id?: string) => void;
    inputRef: MutableRefObject<HTMLInputElement | null>;
    setIsSelecting: (value: boolean) => void;
}
export function TagDropdownList(props: Props) {
    const { strValue, tags, setAndSubmit, inputRef, setIsSelecting } = props;

    const suggestions = matchSorter<Tag>(tags, strValue, { keys: ['value'] }).map((tag) => {
        return { value: tag.value, colour: undefined, _id: tag._id };
    }) as Suggestion[];

    const handleSelect = (item: Suggestion) => {
        setAndSubmit(item.value, item._id);
        inputRef.current?.blur();
    };

    const handleOutsideEnter = () => {
        setAndSubmit(strValue);
        inputRef.current?.blur();
    };

    const { highlightedIndex, setHighlightedIndex } = useNavigatableList<Suggestion>(
        suggestions,
        handleSelect,
        inputRef,
        handleOutsideEnter
    );

    const listItems = suggestions.map((item, index) => {
        return (
            <DropdownItem
                key={index}
                color={item.colour}
                value={item.value}
                onClick={() => {
                    handleSelect(item);
                    setIsSelecting(false);
                }}
                setIsSelecting={setIsSelecting}
                isHighlighted={index === highlightedIndex}
                setHighlighted={() => setHighlightedIndex(index)}
                resetHighlighted={() => setHighlightedIndex(-1)}
            />
        );
    });

    return <LayoutGroup>{listItems}</LayoutGroup>;
}
