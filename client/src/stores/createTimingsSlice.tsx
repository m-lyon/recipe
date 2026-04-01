import { StateCreator } from 'zustand';

import { RecipeState } from './useRecipeStore';

export interface TimingsSlice {
    activeTime: number | null;
    passiveTime: number | null;
    setActiveTime: (value: number | null) => void;
    setPassiveTime: (value: number | null) => void;
    resetTimings: () => void;
}
export const createTimingsSlice: StateCreator<RecipeState, [], [], TimingsSlice> = (set) => ({
    activeTime: null,
    passiveTime: null,
    setActiveTime: (value) => set(() => ({ activeTime: value })),
    setPassiveTime: (value) => set(() => ({ passiveTime: value })),
    resetTimings: () => set(() => ({ activeTime: null, passiveTime: null })),
});
