import { StateCreator } from 'zustand';

import { SearchState } from './useSearchStore';
export interface CalculatedTagChoice {
    value: ReservedTags;
    _id: undefined;
}
export interface TagFilterSlice {
    tagQuery: string;
    setTagQuery: (value: string) => void;
    resetTagFilter: () => void;
    showTagDropdown: boolean;
    setShowTagDropdown: (value: boolean) => void;
    selectedTags: FilterChoiceWithId[];
    selectedCalculatedTags: CalculatedTagChoice[];
    addTag: (tag: FilterChoiceWithId) => FilterChoiceWithId[];
    removeTag: (_id: string) => FilterChoiceWithId[];
    addCalculatedTag: (tag: CalculatedTagChoice) => CalculatedTagChoice[];
    removeCalculatedTag: (value: string) => CalculatedTagChoice[];
}

export const createTagFilterSlice: StateCreator<SearchState, [], [], TagFilterSlice> = (
    set,
    get
) => ({
    tagQuery: '',
    setTagQuery: (value) => set(() => ({ tagQuery: value })),
    resetTagFilter: () =>
        set(() => ({ tagQuery: '', selectedTags: [], selectedCalculatedTags: [] })),
    showTagDropdown: false,
    setShowTagDropdown: (value) => set(() => ({ showTagDropdown: value })),
    selectedTags: [],
    selectedCalculatedTags: [],
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
    addCalculatedTag: (tag) => {
        set((state) => ({ selectedCalculatedTags: [...state.selectedCalculatedTags, tag] }));
        return get().selectedCalculatedTags;
    },
    removeCalculatedTag: (tag) => {
        set((state) => ({
            selectedCalculatedTags: state.selectedCalculatedTags.filter(
                (calculatedTag) => calculatedTag.value !== tag
            ),
        }));
        return get().selectedCalculatedTags;
    },
});
