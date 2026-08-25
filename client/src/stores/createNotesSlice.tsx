import { StateCreator } from 'zustand';

import { autoFormat } from '@recipe/utils/autoformat';

import { RecipeState } from './useRecipeStore';

export interface NotesSlice {
    notes: string;
    setNotes: (value: string) => void;
    resetNotes: () => void;
}
export const createNotesSlice: StateCreator<RecipeState, [], [], NotesSlice> = (set) => ({
    notes: '',
    setNotes: (value: string) => set(() => ({ notes: autoFormat(value) })),
    resetNotes: () => set(() => ({ notes: '' })),
});
