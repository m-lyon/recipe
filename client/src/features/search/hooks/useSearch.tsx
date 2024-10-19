import { useState } from 'react';
import { useLazyQuery } from '@apollo/client';
import { useDebounce, useDebouncedCallback } from 'use-debounce';

import { GET_RECIPES } from '@recipe/graphql/queries/recipe';
import { DEBOUNCE_TIME, INIT_LOAD_NUM } from '@recipe/constants';

export interface SearchHook {
    searchQuery: string;
    delayedSearchQuery: string;
    onSearch: (value: string) => void;
}
export function useSearch() {
    const [searchQuery, setSearchQuery] = useState('');
    const [delayedSearchQuery] = useDebounce(searchQuery, DEBOUNCE_TIME);
    const [searchRecipes] = useLazyQuery(GET_RECIPES, { fetchPolicy: 'network-only' });
    const debounced = useDebouncedCallback((value: string) => {
        searchRecipes({
            variables: {
                offset: 0,
                limit: INIT_LOAD_NUM,
                filter: value ? { _operators: { title: { regex: `/${value}/i` } } } : undefined,
            },
        });
    }, DEBOUNCE_TIME);

    const onSearch = (value: string) => {
        setSearchQuery(value);
        debounced(value);
    };

    return { searchQuery, delayedSearchQuery, onSearch };
}
