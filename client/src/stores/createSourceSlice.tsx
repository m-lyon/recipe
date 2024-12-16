import { StateCreator } from 'zustand';

import { RecipeState } from './useRecipeStore';

export interface SourceSlice {
    source: string;
    setSource: (value: string) => void;
    resetSource: () => void;
}
export const createSourceSlice: StateCreator<RecipeState, [], [], SourceSlice> = (set) => ({
    source: '',
    setSource: (value: string) => set(() => ({ source: value })),
    resetSource: () => set(() => ({ source: '' })),
});
