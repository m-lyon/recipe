import { useSearchStore } from '@recipe/stores';

import { Filter } from './Filter';
import { useAllTagSuggestions } from '../hooks/useAllTagsSuggestions';

interface Props {
    addFilter: (item: FilterChoice, type: FilterChoiceType) => void;
}
export function TagFilter(props: Props) {
    const { addFilter } = props;
    const query = useSearchStore((state) => state.tagQuery);
    const setQuery = useSearchStore((state) => state.setTagQuery);
    const tags = useSearchStore((state) => state.selectedTags);
    const open = useSearchStore((state) => state.showTagDropdown);
    const setIsOpen = useSearchStore((state) => state.setShowTagDropdown);
    const suggestions = useAllTagSuggestions(tags, query);

    return (
        <Filter
            value={query}
            setValue={setQuery}
            placeholder='Filter by tags'
            open={open}
            setIsOpen={setIsOpen}
            addItem={(item) => {
                if (item._id) {
                    addFilter(item, 'Tag');
                    setQuery('');
                } else {
                    addFilter(item, 'CalculatedTag');
                    setQuery('');
                }
            }}
            suggestions={suggestions}
        />
    );
}
