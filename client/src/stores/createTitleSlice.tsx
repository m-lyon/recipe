import { StateCreator } from 'zustand';

export interface TitleSlice {
    title: string;
    setTitle: (value: string) => void;
    resetTitle: () => void;
}
export const createTitleSlice: StateCreator<TitleSlice, [], [], TitleSlice> = (set) => ({
    title: '',
    setTitle: (value: string) => set(() => ({ title: value })),
    resetTitle: () => set(() => ({ title: '' })),
});
