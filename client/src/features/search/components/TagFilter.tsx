import { useSearchStore } from '@recipe/stores';
import { useTagSuggestions } from '@recipe/features/tags';

import { Filter } from './Filter';
import { useSearch } from '../hooks/useSearch';

export function TagFilter() {
    const query = useSearchStore((state) => state.tagQuery);
    const setQuery = useSearchStore((state) => state.setTagQuery);
    const tags = useSearchStore((state) => state.selectedTags);
    const isOpen = useSearchStore((state) => state.showTagDropdown);
    const setIsOpen = useSearchStore((state) => state.setShowTagDropdown);
    const suggestions = useTagSuggestions(tags, query);
    const { addFilter } = useSearch();

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
