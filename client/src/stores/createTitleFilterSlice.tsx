import { StateCreator } from 'zustand';

import { SearchState } from './useSearchStore';

export interface TitleFilterSlice {
    titleFilter: string;
    setTitleFilter: (value: string) => string;
    resetTitleFilter: () => void;
}

export const createTitleFilterSlice: StateCreator<SearchState, [], [], TitleFilterSlice> = (
    set
) => ({
    titleFilter: '',
    setTitleFilter: (value: string) => {
        set(() => ({ titleFilter: value }));
        return value;
    },
    resetTitleFilter: () => set(() => ({ titleFilter: '' })),
});
