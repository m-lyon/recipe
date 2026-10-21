import { StateCreator } from 'zustand';

import { RecipeState } from './useRecipeStore';

/** One row of a recipe's yield, as it is being edited: "2 each", "900 g". */
export interface EditableYieldRow {
    quantity: string;
    unit: UnitChoice | null;
}

export interface YieldSlice {
    yieldRows: EditableYieldRow[];
    /** True when the recipe being edited was saved with a yield, so clearing it must be sent. */
    hadYield: boolean;
    /** Loads a saved recipe's yield. */
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
