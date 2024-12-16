import { StateCreator } from 'zustand';

import { RecipeState } from './useRecipeStore';

export interface TitleSlice {
    title: string;
    setTitle: (value: string) => void;
    resetTitle: () => void;
}
export const createTitleSlice: StateCreator<RecipeState, [], [], TitleSlice> = (set) => ({
    title: '',
    setTitle: (value: string) => set(() => ({ title: value })),
    resetTitle: () => set(() => ({ title: '' })),
});
