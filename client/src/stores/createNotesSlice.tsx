import { StateCreator } from 'zustand';

export interface NotesSlice {
    notes: string;
    setNotes: (value: string) => void;
    resetNotes: () => void;
}
export const createNotesSlice: StateCreator<NotesSlice, [], [], NotesSlice> = (set) => ({
    notes: '',
    setNotes: (value: string) => set(() => ({ notes: value })),
    resetNotes: () => set(() => ({ notes: '' })),
});
