import { StateCreator } from 'zustand';

export interface SourceSlice {
    source: string;
    setSource: (value: string) => void;
    resetSource: () => void;
}
export const createSourceSlice: StateCreator<SourceSlice, [], [], SourceSlice> = (set) => ({
    source: '',
    setSource: (value: string) => set(() => ({ source: value })),
    resetSource: () => set(() => ({ source: '' })),
});
