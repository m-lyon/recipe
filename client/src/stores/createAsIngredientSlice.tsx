import { StateCreator } from 'zustand';

import { RecipeState } from './useRecipeStore';

export interface AsIngredientSlice {
    pluralTitle?: string;
    isIngredient: boolean;
    setPluralTitle: (value: string) => void;
    setAsIngredient: () => void;
    setIsIngredient: (value: boolean) => void;
    resetAsIngredient: () => void;
}
export const createAsIngredientSlice: StateCreator<RecipeState, [], [], AsIngredientSlice> = (
    set
) => ({
    pluralTitle: undefined,
    isIngredient: false,
    setPluralTitle: (value: string) => set(() => ({ pluralTitle: value })),
    setAsIngredient: () => set(() => ({ isIngredient: true })),
    setIsIngredient: (value: boolean) => set(() => ({ isIngredient: value })),
    resetAsIngredient: () => set(() => ({ pluralTitle: undefined, isIngredient: false })),
});
