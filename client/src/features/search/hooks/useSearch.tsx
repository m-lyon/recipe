import { useCallback } from 'react';
import { useLazyQuery } from '@apollo/client';
import { useDebouncedCallback } from 'use-debounce';
import { useSearchStore } from 'stores/useSearchStore';

import { GET_RECIPES } from '@recipe/graphql/queries/recipe';
import { DEBOUNCE_TIME, INIT_LOAD_NUM } from '@recipe/constants';

export interface SearchHook {
    searchQuery: string;
    onSearch: (value: string) => void;
    resetSearch: () => void;
}
export function useSearch() {
    const searchQuery = useSearchStore((state) => state.titleFilter);
    const setSearchQuery = useSearchStore((state) => state.setTitleFilter);
    const reset = useSearchStore((state) => state.resetSearch);
    const setDelayedSearchQuery = useSearchStore((state) => state.setDelayedTitleFilter);
    const [searchRecipes] = useLazyQuery(GET_RECIPES, { fetchPolicy: 'network-only' });
    const debounced = useDebouncedCallback((value: string) => {
        setDelayedSearchQuery(value);
        searchRecipes({
            variables: {
                offset: 0,
                limit: INIT_LOAD_NUM,
                filter: value ? { _operators: { title: { regex: `/${value}/i` } } } : undefined,
            },
        });
    }, DEBOUNCE_TIME);

    const resetSearch = useCallback(() => {
        reset();
        // TODO: add logic to check if other filters are active here
        if (searchQuery) {
            searchRecipes({ variables: { offset: 0, limit: INIT_LOAD_NUM } });
        }
    }, [searchQuery, reset, searchRecipes]);

    const onSearch = useCallback(
        (value: string) => {
            setSearchQuery(value);
            debounced(value);
        },
        [debounced, setSearchQuery]
    );

    return { searchQuery, onSearch, resetSearch };
}
