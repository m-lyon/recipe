import { StateCreator, create } from 'zustand';

import { TagFilterSlice } from './createTagFilterSlice';
import { createTagFilterSlice } from './createTagFilterSlice';
import { TitleFilterSlice, createTitleFilterSlice } from './createTitleFilterSlice';

interface SharedSlice {
    showSearch: boolean;
    setShowSearch: (showSearch: boolean) => void;
    resetSearch: () => void;
}
export type SearchState = SharedSlice & TitleFilterSlice & TagFilterSlice;

const createSharedSlice: StateCreator<SearchState, [], [], SharedSlice> = (set, get) => ({
    showSearch: false,
    setShowSearch: (showSearch) => set(() => ({ showSearch })),
    resetSearch: () => {
        get().resetTitleFilter();
        set(() => ({ showSearch: false }));
    },
});

export const useSearchStore = create<SearchState>()((...a) => ({
    ...createSharedSlice(...a),
    ...createTitleFilterSlice(...a),
    ...createTagFilterSlice(...a),
}));
