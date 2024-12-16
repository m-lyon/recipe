import { StateCreator } from 'zustand';

import { RecipeState } from './useRecipeStore';

export interface NumServingsSlice {
    numServings: number;
    increaseNumServings: () => void;
    decreaseNumServings: () => void;
    setNumServings: (value: number) => void;
    resetNumServings: () => void;
}
export const createNumServingsSlice: StateCreator<RecipeState, [], [], NumServingsSlice> = (
    set
) => ({
    numServings: 1,
    increaseNumServings: () => set((state) => ({ numServings: state.numServings + 1 })),
    decreaseNumServings: () => set((state) => ({ numServings: state.numServings - 1 })),
    setNumServings: (value: number) => set(() => ({ numServings: value })),
    resetNumServings: () => set(() => ({ numServings: 1 })),
});
