import { StateCreator } from 'zustand';

import { SearchState } from './useSearchStore';

export interface TagFilterSlice {
    tagFilter: string;
    setTagFilter: (value: string) => void;
    resetTagFilter: () => void;
    showTagDropdown: boolean;
    setShowTagDropdown: (value: boolean) => void;
    selectedTags: TagChoice[];
    addTag: (tag: TagChoice) => void;
    removeTag: (tag: TagChoice) => void;
}

export const createTagFilterSlice: StateCreator<SearchState, [], [], TagFilterSlice> = (set) => ({
    tagFilter: '',
    setTagFilter: (value: string) => set(() => ({ tagFilter: value })),
    resetTagFilter: () => set(() => ({ tagFilter: '' })),
    showTagDropdown: false,
    setShowTagDropdown: (value: boolean) => set(() => ({ showTagDropdown: value })),
    selectedTags: [],
    addTag: (tag: TagChoice) => set((state) => ({ selectedTags: [...state.selectedTags, tag] })),
    removeTag: (tag: TagChoice) =>
        set((state) => ({
            selectedTags: state.selectedTags.filter((t) => t.value !== tag.value),
        })),
});
