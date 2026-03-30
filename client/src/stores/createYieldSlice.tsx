import { StateCreator } from 'zustand';

import { RecipeState } from './useRecipeStore';

export interface YieldSlice {
    yieldQuantity: string | null;
    yieldUnit: UnitChoice | null;
    setYieldQuantity: (value: string | null) => void;
    setYieldUnit: (unit: UnitChoice | null) => void;
    resetYield: () => void;
}
export const createYieldSlice: StateCreator<RecipeState, [], [], YieldSlice> = (set) => ({
    yieldQuantity: null,
    yieldUnit: null,
    setYieldQuantity: (value) => set(() => ({ yieldQuantity: value })),
    setYieldUnit: (unit) => set(() => ({ yieldUnit: unit })),
    resetYield: () => set(() => ({ yieldQuantity: null, yieldUnit: null })),
});
