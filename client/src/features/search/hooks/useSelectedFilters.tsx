import { useShallow } from 'zustand/shallow';

import { useSearchStore } from '@recipe/stores';

export function useSelectedFilters() {
    const showSearch = useSearchStore((state) => state.showSearch);
    const showSelected = useSearchStore(
        (state) =>
            state.selectedTags.length ||
            state.selectedIngredients.length ||
            state.selectedCalculatedTags.length
    );
    const selectedFilters = useSearchStore(
        useShallow((state) => [
            ...state.selectedTags,
            ...state.selectedCalculatedTags,
            ...state.selectedIngredients,
        ])
    );

    return { showSearch, showSelected, selectedFilters };
}
