import { produce } from 'immer';
import { StateCreator } from 'zustand';

import { ApplyUnitConversion } from '@recipe/features/servings';
import { getEditableRecipeIngredientStr } from '@recipe/utils/formatting';

import { RecipeState } from './useRecipeStore';
import { EditableFlow, changeEditable, getEditableAttributeString } from './editableItem';
import { getEmptyEditable, removeEditableCharacter, setEditableAttribute } from './editableItem';

interface EditableSubsection {
    name?: string;
    finished: FinishedRecipeIngredient[];
    editable: EditableRecipeIngredient;
}
function getFinishedFromEditable(editable: EditableRecipeIngredient): FinishedRecipeIngredient {
    if (editable.ingredient.value == null || editable.ingredient.data == null) {
        throw new Error('Ingredient must have a value');
    }
    const finished = {
        key: crypto.randomUUID(),
        quantity: editable.quantity,
        unit: editable.unit.data ? editable.unit.data : null,
        size: editable.size.data ? editable.size.data : null,
        ingredient: editable.ingredient.data,
        prepMethod: editable.prepMethod.data ? editable.prepMethod.data : null,
    };
    return finished;
}
function ingredientFlow(state: IngredientSectionsSlice, section: number): EditableFlow {
    return {
        steps: ['quantity', 'unit', 'size', 'ingredient', 'prepMethod'],
        finish: (item) => {
            if (item.ingredient.value === null) {
                return;
            }
            state.ingredientSections[section].finished.push(getFinishedFromEditable({ ...item }));
            const newEditable = getEmptyEditable();
            newEditable.showDropdown = true;
            state.ingredientSections[section].editable = newEditable;
        },
    };
}
export interface IngredientSectionsSlice {
    ingredientSections: EditableSubsection[];
    showIngredientDropdown: (section: number) => void;
    removeFinishedIngredient: (section: number, index: number) => void;
    resetEditableIngredient: (section: number) => void;
    resetIngredients: () => void;
    setIngredientPopover: (section: number, type: PopoverType) => void;
    getIngredientString: (section: number) => string;
    getIngredientAttributeString: (section: number) => string;
    setEditableIngredientAttribute: (
        section: number,
        attr: SetAttr,
        data: IngredientComponents | undefined,
        apply: ApplyUnitConversion
    ) => void;
    removeIngredientCharacter: (section: number) => void;
    handleIngredientChange: (
        section: number,
        value: string,
        data: IngredientComponents | undefined,
        apply: ApplyUnitConversion
    ) => void;
    setFinishedIngredients: (section: number, ingredients: FinishedRecipeIngredient[]) => void;
    addIngredientSection: () => void;
    removeIngredientSection: (section: number) => void;
    setIngredientSection: (
        section: number,
        finished: FinishedRecipeIngredient[],
        name?: string
    ) => void;
    setIngredientSectionName: (section: number, value: string) => void;
}
export const createIngredientsSlice: StateCreator<RecipeState, [], [], IngredientSectionsSlice> = (
    set,
    get
) => ({
    ingredientSections: [{ finished: [], editable: getEmptyEditable() }],
    showIngredientDropdown: (section: number) =>
        set(
            produce((state: IngredientSectionsSlice) => {
                state.ingredientSections[section].editable.showDropdown = true;
            })
        ),
    removeFinishedIngredient: (section: number, index: number) =>
        set(
            produce((state: IngredientSectionsSlice) => {
                state.ingredientSections[section].finished.splice(index, 1);
            })
        ),
    resetEditableIngredient: (section: number) =>
        set(
            produce((state: IngredientSectionsSlice) => {
                state.ingredientSections[section].editable = getEmptyEditable();
            })
        ),
    resetIngredients: () => {
        set({
            ingredientSections: [{ finished: [], editable: getEmptyEditable() }],
        });
    },
    setIngredientPopover: (section: number, type: PopoverType) =>
        set(
            produce((state: IngredientSectionsSlice) => {
                state.ingredientSections[section].editable.popover = type;
            })
        ),
    getIngredientString: (section: number) =>
        getEditableRecipeIngredientStr(get().ingredientSections[section].editable),
    getIngredientAttributeString: (section: number) =>
        getEditableAttributeString(get().ingredientSections[section].editable),
    setEditableIngredientAttribute: (
        section: number,
        attr: SetAttr,
        data: IngredientComponents | undefined,
        apply: ApplyUnitConversion
    ) =>
        set(
            produce((state: IngredientSectionsSlice) => {
                const item = state.ingredientSections[section].editable;
                setEditableAttribute(item, ingredientFlow(state, section), attr, data, apply);
            })
        ),
    removeIngredientCharacter: (section: number) =>
        set(
            produce((state: IngredientSectionsSlice) => {
                removeEditableCharacter(state.ingredientSections[section].editable);
            })
        ),
    handleIngredientChange: (
        section: number,
        value: string,
        data: IngredientComponents | undefined,
        apply: ApplyUnitConversion
    ) =>
        set(
            produce((state: IngredientSectionsSlice) => {
                const item = state.ingredientSections[section].editable;
                changeEditable(item, ingredientFlow(state, section), value, data, apply);
            })
        ),
    setFinishedIngredients: (section: number, ingredients: FinishedRecipeIngredient[]) =>
        set(
            produce((state: IngredientSectionsSlice) => {
                state.ingredientSections[section].finished = ingredients;
            })
        ),
    addIngredientSection: () =>
        set(
            produce((state: IngredientSectionsSlice) => {
                state.ingredientSections.push({ finished: [], editable: getEmptyEditable() });
            })
        ),
    removeIngredientSection: (section: number) =>
        set(
            produce((state: IngredientSectionsSlice) => {
                state.ingredientSections.splice(section, 1);
            })
        ),
    setIngredientSection: (section: number, finished: FinishedRecipeIngredient[], name?: string) =>
        set(
            produce((state: IngredientSectionsSlice) => {
                state.ingredientSections[section].finished = finished;
                state.ingredientSections[section].name = name;
            })
        ),
    setIngredientSectionName: (section: number, value: string) =>
        set(
            produce((state: IngredientSectionsSlice) => {
                state.ingredientSections[section].name = value;
            })
        ),
});
