import { StateCreator } from 'zustand';

import { RecipeState } from './useRecipeStore';

export interface AsIngredientSlice {
    pluralTitle?: string;
    isIngredient: boolean;
    prepAhead: boolean;
    prepAheadLabel?: string;
    setPluralTitle: (value: string) => void;
    setAsIngredient: () => void;
    toggleIsIngredient: () => void;
    togglePrepAhead: () => void;
    setPrepAheadLabel: (value: string) => void;
    resetAsIngredient: () => void;
}
export const createAsIngredientSlice: StateCreator<RecipeState, [], [], AsIngredientSlice> = (
    set
) => ({
    pluralTitle: undefined,
    isIngredient: false,
    prepAhead: false,
    prepAheadLabel: undefined,
    setPluralTitle: (value: string) => set(() => ({ pluralTitle: value })),
    setAsIngredient: () => set(() => ({ isIngredient: true })),
    toggleIsIngredient: () =>
        set((state) => ({
            isIngredient: !state.isIngredient,
            // Reset prep ahead when disabling isIngredient
            ...(state.isIngredient ? { prepAhead: false, prepAheadLabel: undefined } : {}),
        })),
    togglePrepAhead: () =>
        set((state) => ({
            prepAhead: !state.prepAhead,
            ...(state.prepAhead ? { prepAheadLabel: undefined } : {}),
        })),
    setPrepAheadLabel: (value: string) => set(() => ({ prepAheadLabel: value })),
    resetAsIngredient: () =>
        set(() => ({
            pluralTitle: undefined,
            isIngredient: false,
            prepAhead: false,
            prepAheadLabel: undefined,
        })),
});
