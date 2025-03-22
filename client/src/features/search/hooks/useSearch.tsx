import { useCallback, useMemo } from 'react';
import { useShallow } from 'zustand/shallow';
import { useLazyQuery } from '@apollo/client';
import { useDebouncedCallback } from 'use-debounce';

import { useSearchStore } from '@recipe/stores';
import { GET_RECIPES } from '@recipe/graphql/queries/recipe';
import { DEBOUNCE_TIME, INIT_LOAD_NUM } from '@recipe/constants';

import { Query, getSearchFilter } from '../utils/filter';

interface SearchHook {
    filter: ReturnType<typeof getSearchFilter>;
    setTitle: (value: string) => void;
    reset: () => void;
    addFilter: (item: FilterChoice, type: FilterChoiceType) => void;
    removeFilter: (item: FilterChoice) => void;
}
export function useSearch(): SearchHook {
    const title = useSearchStore((state) => state.titleFilter);
    const tags = useSearchStore(useShallow((state) => state.selectedTags.map((tag) => tag._id)));
    const calculatedTags = useSearchStore(
        useShallow((state) => state.selectedCalculatedTags.map((tag) => tag.value))
    );
    const ingredients = useSearchStore(
        useShallow((state) => state.selectedIngredients.map((ingredient) => ingredient._id))
    );
    const setTitleStore = useSearchStore((state) => state.setTitle);
    const resetSearch = useSearchStore((state) => state.resetSearch);
    const addItem = useSearchStore((state) => state.addItem);
    const removeItem = useSearchStore((state) => state.removeItem);
    const [searchRecipes] = useLazyQuery(GET_RECIPES, { fetchPolicy: 'network-only' });
    const debouncedSearch = useDebouncedCallback((newQuery: Query) => {
        const newFilter = getSearchFilter(newQuery);
        searchRecipes({
            variables: {
                offset: 0,
                limit: INIT_LOAD_NUM,
                filter: newFilter,
                countFilter: newFilter,
            },
        });
    }, DEBOUNCE_TIME);
    const filter = useMemo(
        () => getSearchFilter({ title, tags, calculatedTags, ingredients }),
        [title, tags, calculatedTags, ingredients]
    );
    const reset = useCallback(() => {
        if (filter) {
            searchRecipes({ variables: { offset: 0, limit: INIT_LOAD_NUM } });
        }
        resetSearch();
    }, [filter, resetSearch, searchRecipes]);

    const setTitle = useCallback(
        (value: string) => {
            const query = setTitleStore(value);
            debouncedSearch(query);
        },
        [debouncedSearch, setTitleStore]
    );

    const addFilter = useCallback(
        (item: FilterChoice, type: FilterChoiceType) => {
            const query = addItem(item, type);
            debouncedSearch(query);
        },
        [addItem, debouncedSearch]
    );

    const removeFilter = useCallback(
        (item: FilterChoice) => {
            const query = removeItem(item);
            debouncedSearch(query);
        },
        [removeItem, debouncedSearch]
    );

    return { filter, setTitle, reset, addFilter, removeFilter };
}
