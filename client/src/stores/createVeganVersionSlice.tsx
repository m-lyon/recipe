import { StateCreator } from 'zustand';

import { RecipeState } from './useRecipeStore';

export interface VeganVersionSlice {
    createVeganVersion: boolean;
    setCreateVeganVersion: (val: boolean) => void;
    resetCreateVeganVersion: () => void;
}
export const createVeganVersionSlice: StateCreator<RecipeState, [], [], VeganVersionSlice> = (
    set
) => ({
    createVeganVersion: false,
    setCreateVeganVersion: (val: boolean) => set(() => ({ createVeganVersion: val })),
    resetCreateVeganVersion: () => set(() => ({ createVeganVersion: false })),
});
