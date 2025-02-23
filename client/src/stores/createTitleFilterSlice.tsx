import { StateCreator } from 'zustand';

import { SearchState } from './useSearchStore';

export interface TitleFilterSlice {
    titleFilter: string;
    delayedTitleFilter: string;
    setTitleFilter: (value: string) => void;
    setDelayedTitleFilter: (value: string) => void;
    resetTitleFilter: () => void;
}

export const createTitleFilterSlice: StateCreator<SearchState, [], [], TitleFilterSlice> = (
    set
) => ({
    titleFilter: '',
    delayedTitleFilter: '',
    setTitleFilter: (value: string) => set(() => ({ titleFilter: value })),
    setDelayedTitleFilter: (value: string) => set(() => ({ delayedTitleFilter: value })),
    resetTitleFilter: () => set(() => ({ titleFilter: '', delayedTitleFilter: '' })),
});
