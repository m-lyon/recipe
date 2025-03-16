import { StateCreator } from 'zustand';

import { SearchState } from './useSearchStore';

export interface TagFilterSlice {
    tagQuery: string;
    setTagQuery: (value: string) => void;
    resetTagFilter: () => void;
    showTagDropdown: boolean;
    setShowTagDropdown: (value: boolean) => void;
    selectedTags: FilterChoice[];
    addTag: (tag: FilterChoice) => FilterChoice[];
    removeTag: (_id: string) => FilterChoice[];
}

export const createTagFilterSlice: StateCreator<SearchState, [], [], TagFilterSlice> = (
    set,
    get
) => ({
    tagQuery: '',
    setTagQuery: (value) => set(() => ({ tagQuery: value })),
    resetTagFilter: () => set(() => ({ tagQuery: '', selectedTags: [] })),
    showTagDropdown: false,
    setShowTagDropdown: (value) => set(() => ({ showTagDropdown: value })),
    selectedTags: [],
    addTag: (tag) => {
        set((state) => ({ selectedTags: [...state.selectedTags, tag] }));
        return get().selectedTags;
    },
    removeTag: (_id) => {
        set((state) => ({
            selectedTags: state.selectedTags.filter((tag) => tag._id !== _id),
        }));
        return get().selectedTags;
    },
});
