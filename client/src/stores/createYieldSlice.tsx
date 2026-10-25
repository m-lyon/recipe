import { produce } from 'immer';
import { StateCreator } from 'zustand';

import { ApplyUnitConversion } from '@recipe/features/servings';
import { getEditableRecipeIngredientStr } from '@recipe/utils/formatting';

import { RecipeState } from './useRecipeStore';
import { EditableFlow, changeEditable, getEditableAttributeString } from './editableItem';
import { getEmptyEditable, removeEditableCharacter, setEditableAttribute } from './editableItem';

export interface EditableYieldRow {
    quantity: string;
    unit: UnitChoice | null;
}

/** A yield row is a quantity and a unit, added to the yield when the unit is set. */
function yieldFlow(state: YieldSlice): EditableFlow {
    return {
        steps: ['quantity', 'unit'],
        finish: (item) => {
            if (item.quantity === null || !item.unit.data) {
                return;
            }
            state.yieldRows.push({ quantity: item.quantity, unit: item.unit.data });
            state.yieldEditable = getEmptyEditable();
        },
    };
}

export interface YieldSlice {
    yieldRows: EditableYieldRow[];
    yieldEditable: EditableRecipeIngredient;
    hadYield: boolean;
    setYield: (rows: EditableYieldRow[]) => void;
    removeYieldRow: (index: number) => void;
    resetYield: () => void;
    showYieldDropdown: () => void;
    resetEditableYield: () => void;
    getYieldString: () => string;
    getYieldAttributeString: () => string;
    setEditableYieldAttribute: (
        attr: SetAttr,
        data: IngredientComponents | undefined,
        apply: ApplyUnitConversion
    ) => void;
    removeYieldCharacter: () => void;
    handleYieldChange: (
        value: string,
        data: IngredientComponents | undefined,
        apply: ApplyUnitConversion
    ) => void;
}
export const createYieldSlice: StateCreator<RecipeState, [], [], YieldSlice> = (set, get) => ({
    yieldRows: [],
    yieldEditable: getEmptyEditable(),
    hadYield: false,
    setYield: (rows) =>
        set(() => ({
            yieldRows: rows,
            yieldEditable: getEmptyEditable(),
            hadYield: rows.length > 0,
        })),
    removeYieldRow: (index) =>
        set((state) => ({ yieldRows: state.yieldRows.filter((_, i) => i !== index) })),
    resetYield: () =>
        set(() => ({ yieldRows: [], yieldEditable: getEmptyEditable(), hadYield: false })),
    showYieldDropdown: () =>
        set(
            produce((state: YieldSlice) => {
                state.yieldEditable.showDropdown = true;
            })
        ),
    resetEditableYield: () => set(() => ({ yieldEditable: getEmptyEditable() })),
    getYieldString: () => getEditableRecipeIngredientStr(get().yieldEditable),
    getYieldAttributeString: () => getEditableAttributeString(get().yieldEditable),
    setEditableYieldAttribute: (attr, data, apply) =>
        set(
            produce((state: YieldSlice) => {
                setEditableAttribute(state.yieldEditable, yieldFlow(state), attr, data, apply);
            })
        ),
    removeYieldCharacter: () =>
        set(
            produce((state: YieldSlice) => {
                removeEditableCharacter(state.yieldEditable);
            })
        ),
    handleYieldChange: (value, data, apply) =>
        set(
            produce((state: YieldSlice) => {
                changeEditable(state.yieldEditable, yieldFlow(state), value, data, apply);
            })
        ),
});
