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
    removeItem: (item: FilterChoice) => Query;
}
export type SearchState = SharedSlice & TitleFilterSlice & TagFilterSlice & IngredientFilterSlice;

const createSharedSlice: StateCreator<SearchState, [], [], SharedSlice> = (set, get) => ({
    showSearch: false,
    setShowSearch: (showSearch) => set(() => ({ showSearch })),
    resetSearch: () => {
        get().resetTitleFilter();
        get().resetTagFilter();
        get().resetIngrFilter();
        set(() => ({ showSearch: false }));
    },
    setTitle(value) {
        const title = get().setTitleFilter(value);
        const tags = get().selectedTags.map((tag) => tag._id);
        const calculatedTags = get().selectedCalculatedTags.map((tag) => tag.value);
        const ingredients = get().selectedIngredients.map((ingr) => ingr._id);
        return { title, tags, calculatedTags, ingredients };
    },
    addItem: (item, type) => {
        const { _id, value } = item;
        const title = get().titleFilter;

        if (type === 'CalculatedTag') {
            if (_id !== undefined) throw new Error('CalculatedTag should not have an _id');
            return {
                title,
                tags: get().selectedTags.map((tag) => tag._id),
                calculatedTags: get()
                    .addCalculatedTag({ _id, value })
                    .map((tag) => tag.value),
                ingredients: get().selectedIngredients.map((ingr) => ingr._id),
            };
        }

        if (_id === undefined) throw new Error('Tag and Ingredient should have an _id');
        return {
            title,
            tags: (type === 'Tag' ? get().addTag({ _id, value }) : get().selectedTags).map(
                (tag) => tag._id
            ),
            calculatedTags: get().selectedCalculatedTags.map((tag) => tag.value),
            ingredients: (type === 'Ingredient'
                ? get().addIngr({ _id, value })
                : get().selectedIngredients
            ).map((ingr) => ingr._id),
        };
    },
    removeItem: (item) => {
        const title = get().titleFilter;
        const tags = item._id
            ? get()
                  .removeTag(item._id)
                  .map((tag) => tag._id)
            : get().selectedTags.map((tag) => tag._id);
        const calculatedTags = !item._id
            ? get()
                  .removeCalculatedTag(item.value)
                  .map((tag) => tag.value)
            : get().selectedCalculatedTags.map((tag) => tag.value);
        const ingredients = item._id
            ? get()
                  .removeIngr(item._id)
                  .map((ingr) => ingr._id)
            : get().selectedIngredients.map((ingr) => ingr._id);
        return { title, tags, calculatedTags, ingredients };
    },
});

export const useSearchStore = create<SearchState>()((...a) => ({
    ...createSharedSlice(...a),
    ...createTitleFilterSlice(...a),
    ...createTagFilterSlice(...a),
    ...createIngredientFilterSlice(...a),
}));
