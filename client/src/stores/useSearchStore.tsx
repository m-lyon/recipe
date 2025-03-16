import { StateCreator, create } from 'zustand';

import type { Query } from '@recipe/features/search';

import { TagFilterSlice } from './createTagFilterSlice';
import { createTagFilterSlice } from './createTagFilterSlice';
import { TitleFilterSlice, createTitleFilterSlice } from './createTitleFilterSlice';
import { IngredientFilterSlice, createIngredientFilterSlice } from './createIngredientFilterSlice';

interface SharedSlice {
    showSearch: boolean;
    setShowSearch: (showSearch: boolean) => void;
    resetSearch: () => void;
    setTitle: (value: string) => Query;
    addItem: (item: FilterChoice, type: FilterChoiceType) => Query;
    removeItem: (_id: string) => Query;
}
export type SearchState = SharedSlice & TitleFilterSlice & TagFilterSlice & IngredientFilterSlice;

const createSharedSlice: StateCreator<SearchState, [], [], SharedSlice> = (set, get) => ({
    showSearch: false,
    setShowSearch: (showSearch) => set(() => ({ showSearch })),
    resetSearch: () => {
        get().resetTitleFilter();
        get().resetTagFilter();
        set(() => ({ showSearch: false }));
    },
    setTitle(value) {
        const title = get().setTitleFilter(value);
        const tags = get().selectedTags.map((tag) => tag._id);
        const ingredients = get().selectedIngredients.map((ingr) => ingr._id);
        return { title, tags, ingredients };
    },
    addItem: (item, type) => {
        const title = get().titleFilter;
        const tags = (type === 'Tag' ? get().addTag(item) : get().selectedTags).map(
            (tag) => tag._id
        );
        const ingredients = (
            type === 'Ingredient' ? get().addIngr(item) : get().selectedIngredients
        ).map((ingr) => ingr._id);
        return { title, tags, ingredients };
    },
    removeItem: (_id) => {
        const title = get().titleFilter;
        const tags = get()
            .removeTag(_id)
            .map((tag) => tag._id);
        const ingredients = get()
            .removeIngr(_id)
            .map((ingr) => ingr._id);
        return { title, tags, ingredients };
    },
});

export const useSearchStore = create<SearchState>()((...a) => ({
    ...createSharedSlice(...a),
    ...createTitleFilterSlice(...a),
    ...createTagFilterSlice(...a),
    ...createIngredientFilterSlice(...a),
}));
