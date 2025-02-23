import { create } from 'zustand';

interface IngredientSearchState {
    showSearch: boolean;
    searchQuery: string;
    delayedSearchQuery: string;
    setShowSearch: (showSearch: boolean) => void;
    setSearchQuery: (query: string) => void;
    setDelayedSearchQuery: (query: string) => void;
    resetSearchQuery: () => void;
    // ingredients: FinishedIngredient[];
    // addIngredient: (ingredient: FinishedIngredient) => void;
    // removeIngredient: (index: number) => void;
    // resetIngredients: () => void;
}
export const useIngredientSearchStore = create<IngredientSearchState>()((set) => ({
    showSearch: false,
    searchQuery: '',
    delayedSearchQuery: '',
    setSearchQuery: (searchQuery) => set(() => ({ searchQuery })),
    setDelayedSearchQuery: (delayedSearchQuery) => set(() => ({ delayedSearchQuery })),
    setShowSearch: (showSearch) => set(() => ({ showSearch })),
    resetSearchQuery: () => set(() => ({ searchQuery: '' })),
    // ingredients: [],
    // addIngredient: (ingredient) =>
    //     set((state) => ({ ingredients: [...state.ingredients, ingredient] })),
    // removeIngredient: (index) =>
    //     set((state) => ({
    //         ingredients: state.ingredients.filter((_, i) => i !== index),
    //     })),
    // resetIngredients: () => set(() => ({ ingredients: [] })),
}));
