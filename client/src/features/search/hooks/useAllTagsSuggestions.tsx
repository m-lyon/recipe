import { useQuery } from '@apollo/client';
import { matchSorter } from 'match-sorter';

import { GET_TAGS } from '@recipe/graphql/queries/tag';

export function useAllTagSuggestions(selected: TagChoice[], query: string) {
    const { data } = useQuery(GET_TAGS);
    const tags = data ? data.tagMany : [];
    const otherTags = [
        { value: 'vegan', _id: undefined },
        { value: 'vegetarian', _id: undefined },
        { value: 'ingredient', _id: undefined },
    ];
    const suggestions = matchSorter<TagChoice>(
        [...tags, ...otherTags].filter((tag) => !selected.find((s) => s._id === tag._id)),
        query,
        { keys: ['value'] }
    );

    return suggestions;
}
