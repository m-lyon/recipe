import { useQuery } from '@apollo/client';
import { matchSorter } from 'match-sorter';

import { GET_TAGS } from '@recipe/graphql/queries/tag';

export function useTagSuggestions(selected: TagChoice[], query: string) {
    const { data } = useQuery(GET_TAGS);
    const tags = data ? data.tagMany : [];
    const suggestions = matchSorter<TagChoice>(
        tags.filter((tag) => !selected.find((s) => s._id === tag._id)),
        query,
        { keys: ['value'] }
    );

    return suggestions;
}
