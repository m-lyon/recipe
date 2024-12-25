import { StateCreator } from 'zustand';

import { replaceSymbols } from '@recipe/utils/symbol';

import { RecipeState } from './useRecipeStore';

export interface NotesSlice {
    notes: string;
    setNotes: (value: string) => void;
    resetNotes: () => void;
}
export const createNotesSlice: StateCreator<RecipeState, [], [], NotesSlice> = (set) => ({
    notes: '',
    setNotes: (value: string) => set(() => ({ notes: replaceSymbols(value) })),
    resetNotes: () => set(() => ({ notes: '' })),
});
