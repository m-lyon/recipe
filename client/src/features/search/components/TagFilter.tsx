import { useSearchStore } from '@recipe/stores';
import { useTagSuggestions } from '@recipe/features/tags';

import { Filter } from './Filter';

interface Props {
    addFilter: (item: FilterChoice, type: FilterChoiceType) => void;
}
export function TagFilter(props: Props) {
    const { addFilter } = props;
    const query = useSearchStore((state) => state.tagQuery);
    const setQuery = useSearchStore((state) => state.setTagQuery);
    const tags = useSearchStore((state) => state.selectedTags);
    const isOpen = useSearchStore((state) => state.showTagDropdown);
    const setIsOpen = useSearchStore((state) => state.setShowTagDropdown);
    const suggestions = useTagSuggestions(tags, query);

    return (
        <Filter
            value={query}
            setValue={setQuery}
            placeholder='Filter by tags'
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            addItem={(item) => addFilter(item, 'Tag')}
            suggestions={suggestions}
        />
    );
}
