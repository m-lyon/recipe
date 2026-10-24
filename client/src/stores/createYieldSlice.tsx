import { StateCreator } from 'zustand';

import { RecipeState } from './useRecipeStore';

export interface EditableYieldRow {
    quantity: string;
    unit: UnitChoice | null;
}

export interface YieldSlice {
    yieldRows: EditableYieldRow[];
    hadYield: boolean;
    setYield: (rows: EditableYieldRow[]) => void;
    addYieldRow: () => void;
    updateYieldRow: (index: number, row: Partial<EditableYieldRow>) => void;
    removeYieldRow: (index: number) => void;
    resetYield: () => void;
}
export const createYieldSlice: StateCreator<RecipeState, [], [], YieldSlice> = (set) => ({
    yieldRows: [],
    hadYield: false,
    setYield: (rows) => set(() => ({ yieldRows: rows, hadYield: rows.length > 0 })),
    addYieldRow: () =>
        set((state) => ({ yieldRows: [...state.yieldRows, { quantity: '', unit: null }] })),
    updateYieldRow: (index, row) =>
        set((state) => ({
            yieldRows: state.yieldRows.map((current, i) =>
                i === index ? { ...current, ...row } : current
            ),
        })),
    removeYieldRow: (index) =>
        set((state) => ({ yieldRows: state.yieldRows.filter((_, i) => i !== index) })),
    resetYield: () => set(() => ({ yieldRows: [], hadYield: false })),
});
