import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { UnitSystemPreference } from '@recipe/utils/units';

export type NutritionSourcePreference = 'usda' | 'openFoodFacts' | 'manual';

export interface PreferencesState {
    /** The system a reader wants recipes shown in. Recipes are stored as authored. */
    unitSystem: UnitSystemPreference;
    setUnitSystem: (unitSystem: UnitSystemPreference) => void;
    nutritionSourceByUser: Record<string, NutritionSourcePreference>;
    setNutritionSource: (userId: string, source: NutritionSourcePreference) => void;
}
export const usePreferencesStore = create<PreferencesState>()(
    persist(
        (set) => ({
            unitSystem: 'as-written',
            setUnitSystem: (unitSystem: UnitSystemPreference) => set(() => ({ unitSystem })),
            nutritionSourceByUser: {},
            setNutritionSource: (userId: string, source: NutritionSourcePreference) =>
                set((state) => ({
                    nutritionSourceByUser: { ...state.nutritionSourceByUser, [userId]: source },
                })),
        }),
        { name: 'recipe-preferences' }
    )
);
