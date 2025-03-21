import { StateCreator } from 'zustand';

import { RecipeState } from './useRecipeStore';

export interface AsIngredientSlice {
    pluralTitle?: string;
    isIngredient: boolean;
    setPluralTitle: (value: string) => void;
    setAsIngredient: () => void;
    toggleIsIngredient: () => void;
    resetAsIngredient: () => void;
}
export const createAsIngredientSlice: StateCreator<RecipeState, [], [], AsIngredientSlice> = (
    set
) => ({
    pluralTitle: undefined,
    isIngredient: false,
    setPluralTitle: (value: string) => set(() => ({ pluralTitle: value })),
    setAsIngredient: () => set(() => ({ isIngredient: true })),
    toggleIsIngredient: () => set((state) => ({ isIngredient: !state.isIngredient })),
    resetAsIngredient: () => set(() => ({ pluralTitle: undefined, isIngredient: false })),
});
