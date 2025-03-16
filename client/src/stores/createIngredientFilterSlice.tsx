import { StateCreator } from 'zustand';

import { SearchState } from './useSearchStore';

export interface IngredientFilterSlice {
    ingrQuery: string;
    setIngrQuery: (value: string) => void;
    resetIngrFilter: () => void;
    showIngrDropdown: boolean;
    setShowIngrDropdown: (value: boolean) => void;
    selectedIngredients: FilterChoice[];
    addIngr: (tag: FilterChoice) => FilterChoice[];
    removeIngr: (_id: string) => FilterChoice[];
}

export const createIngredientFilterSlice: StateCreator<
    SearchState,
    [],
    [],
    IngredientFilterSlice
> = (set, get) => ({
    ingrQuery: '',
    setIngrQuery: (value) => set(() => ({ ingrQuery: value })),
    resetIngrFilter: () => set(() => ({ ingrQuery: '', selectedIngredients: [] })),
    showIngrDropdown: false,
    setShowIngrDropdown: (value) => set(() => ({ showIngrDropdown: value })),
    selectedIngredients: [],
    addIngr: (ingr) => {
        set((state) => ({ selectedIngredients: [...state.selectedIngredients, ingr] }));
        return get().selectedIngredients;
    },
    removeIngr: (_id) => {
        set((state) => ({
            selectedIngredients: state.selectedIngredients.filter((ingr) => ingr._id !== _id),
        }));
        return get().selectedIngredients;
    },
});
