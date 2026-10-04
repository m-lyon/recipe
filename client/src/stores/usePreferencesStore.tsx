import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { UnitSystemPreference } from '@recipe/utils/units';

export interface PreferencesState {
    /** The system a reader wants recipes shown in. Recipes are stored as authored. */
    unitSystem: UnitSystemPreference;
    setUnitSystem: (unitSystem: UnitSystemPreference) => void;
}
export const usePreferencesStore = create<PreferencesState>()(
    persist(
        (set) => ({
            unitSystem: 'as-written',
            setUnitSystem: (unitSystem: UnitSystemPreference) => set(() => ({ unitSystem })),
        }),
        { name: 'recipe-preferences' }
    )
);
