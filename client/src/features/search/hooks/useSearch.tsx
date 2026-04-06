import { useShallow } from 'zustand/shallow';
import { useCallback, useMemo } from 'react';
import { useLazyQuery } from '@apollo/client';
import { useDebouncedCallback } from 'use-debounce';

import { useSearchStore } from '@recipe/stores';
import { GET_RECIPES } from '@recipe/graphql/queries/recipe';
import { DEBOUNCE_TIME, INIT_LOAD_NUM } from '@recipe/constants';

import { Query, getSearchFilter } from '../utils/filter';

interface SearchHook {
    filter: ReturnType<typeof getSearchFilter>;
    showArchived: boolean;
    setShowArchived: (v: boolean) => void;
    setTitle: (value: string) => void;
    reset: () => void;
    resetToHome: () => void;
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
    const showArchived = useSearchStore((state) => state.showArchived);
    const setShowArchivedStore = useSearchStore((state) => state.setShowArchived);
    const setTitleStore = useSearchStore((state) => state.setTitle);
    const resetSearch = useSearchStore((state) => state.resetSearch);
    const addItem = useSearchStore((state) => state.addItem);
    const removeItem = useSearchStore((state) => state.removeItem);
    const [searchRecipes] = useLazyQuery(GET_RECIPES, { fetchPolicy: 'network-only' });
    const debouncedSearch = useDebouncedCallback((newQuery: Query) => {
        const newFilter = getSearchFilter(newQuery, showArchived);
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
        () => getSearchFilter({ title, tags, calculatedTags, ingredients }, showArchived),
        [title, tags, calculatedTags, ingredients, showArchived]
    );

    const setShowArchived = useCallback(
        (value: boolean) => {
            setShowArchivedStore(value);
            const newFilter = getSearchFilter({ title, tags, calculatedTags, ingredients }, value);
            searchRecipes({
                variables: {
                    offset: 0,
                    limit: INIT_LOAD_NUM,
                    filter: newFilter,
                    countFilter: newFilter,
                },
            });
        },
        [title, tags, calculatedTags, ingredients, setShowArchivedStore, searchRecipes]
    );

    const reset = useCallback(() => {
        const hasActiveFilters = !!(
            title ||
            tags.length ||
            calculatedTags.length ||
            ingredients.length
        );
        resetSearch();
        if (hasActiveFilters) {
            const currentFilter = { archived: showArchived };
            searchRecipes({
                variables: {
                    offset: 0,
                    limit: INIT_LOAD_NUM,
                    filter: currentFilter,
                    countFilter: currentFilter,
                },
            });
        }
    }, [title, tags, calculatedTags, ingredients, showArchived, resetSearch, searchRecipes]);

    const resetToHome = useCallback(() => {
        resetSearch();
        if (showArchived || title || tags.length || calculatedTags.length || ingredients.length) {
            setShowArchivedStore(false);
            const defaultFilter = { archived: false };
            searchRecipes({
                variables: {
                    offset: 0,
                    limit: INIT_LOAD_NUM,
                    filter: defaultFilter,
                    countFilter: defaultFilter,
                },
            });
        }
    }, [
        showArchived,
        title,
        tags,
        calculatedTags,
        ingredients,
        setShowArchivedStore,
        resetSearch,
        searchRecipes,
    ]);

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

    return {
        filter,
        showArchived,
        setShowArchived,
        setTitle,
        reset,
        resetToHome,
        addFilter,
        removeFilter,
    };
}
