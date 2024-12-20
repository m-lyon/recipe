import { produce } from 'immer';
import { StateCreator } from 'zustand';

import { isPlural } from '@recipe/utils/plural';
import { ApplyUnitConversion } from '@recipe/features/servings';
import { VALID_NUMBER_REGEX, isRange, validateRange } from '@recipe/utils/number';
import { ingredientDisplayValue, sizeDisplayValue } from '@recipe/utils/formatting';
import { getEditableRecipeIngredientStr, unitDisplayValue } from '@recipe/utils/formatting';

import { RecipeState } from './useRecipeStore';

interface EditableSubsection {
    name?: string;
    finished: FinishedRecipeIngredient[];
    editable: EditableRecipeIngredient;
}
function getEmptyIngredient(): EditableRecipeIngredient {
    return {
        quantity: null,
        unit: { value: null, data: undefined },
        size: { value: null, data: undefined },
        ingredient: { value: null, data: undefined },
        prepMethod: { value: null, data: undefined },
        state: 'quantity',
        showDropdown: false,
        popover: null,
    };
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
const STATES: Record<number, EditableState> = {
    0: 'quantity',
    1: 'unit',
    2: 'size',
    3: 'ingredient',
    4: 'prepMethod',
};
export const STATES_ORDER: Record<EditableState, number> = {
    quantity: 0,
    unit: 1,
    size: 2,
    ingredient: 3,
    prepMethod: 4,
};
function getTextDiff(value: string, origStr: string): string {
    if (value.length > origStr.length) {
        return value.replace(origStr, '');
    }
    return '';
}
function incrementState(
    state: IngredientSectionsSlice,
    section: number,
    increment: number | EditableState = 1
) {
    const item = state.ingredientSections[section].editable;
    item.popover = null;
    if (typeof increment === 'string') {
        item.state = increment;
        return;
    }
    const max = Object.keys(STATES).length - 1;
    const newIndex = STATES_ORDER[item.state] + increment;
    item.state = STATES[Math.min(newIndex, max)];
}
function append(state: IngredientSectionsSlice, section: number, value: string) {
    const item = state.ingredientSections[section].editable;
    if (item.state === 'quantity') {
        if (item.quantity === null) {
            item.quantity = value;
        } else {
            item.quantity += value;
        }
    } else {
        if (item[item.state].value === null) {
            item[item.state].value = value;
        } else {
            item[item.state].value += value;
        }
    }
}
function setQuantity(state: IngredientSectionsSlice, section: number, value: FinishedQuantity) {
    const item = state.ingredientSections[section].editable;
    item.quantity = value;
    if (value === null) {
        item.unit = { value: null, data: null };
    }
}
function setUnit(
    state: IngredientSectionsSlice,
    section: number,
    data: FinishedUnit,
    apply: ApplyUnitConversion
) {
    const item = state.ingredientSections[section].editable;
    const { quantity, unit } = apply({ quantity: item.quantity, unit: data });
    item.quantity = quantity;
    item.unit = {
        value: unit !== null ? unitDisplayValue(quantity, unit, true) : null,
        data: unit,
    };
}
function setSize(state: IngredientSectionsSlice, section: number, data: FinishedSize) {
    const item = state.ingredientSections[section].editable;
    item.size = { value: data !== null ? sizeDisplayValue(data) : null, data };
    // Set unit if skipping
    if (item.unit.data === undefined) {
        item.unit = { value: null, data: null };
    }
}
function setIngredient(state: IngredientSectionsSlice, section: number, data: FinishedIngredient) {
    const item = state.ingredientSections[section].editable;
    if (item.unit.data === undefined) {
        item.unit = { value: null, data: null };
    }
    if (item.size.data === undefined) {
        item.size = { value: null, data: null };
    }
    const value =
        data !== null
            ? ingredientDisplayValue(item.quantity, item.unit.data as FinishedUnit, data)
            : null;
    item.ingredient = { value, data };
}
function setPrepMethod(state: IngredientSectionsSlice, section: number, data: FinishedPrepMethod) {
    const item = state.ingredientSections[section].editable;
    item.prepMethod = { value: data !== null ? data.value : null, data };
    if (item.ingredient.value === null) {
        return;
    }
    state.ingredientSections[section].finished.push(getFinishedFromEditable({ ...item }));
    state.ingredientSections[section].editable = getEmptyIngredient();
}
interface handleChangeOpts {
    state: IngredientSectionsSlice;
    section: number;
    char: string;
    item: EditableRecipeIngredient;
    data: IngredientComponents;
    apply: ApplyUnitConversion;
}
function handleQuantityChange(opts: handleChangeOpts) {
    const { state, section, char, item, apply } = opts;
    // Validate quantity upon completion
    if (char === ' ' && item.quantity !== null) {
        if (!VALID_NUMBER_REGEX.test(item.quantity)) {
            throw new Error('Invalid quantity.');
        }
        if (isRange(item.quantity)) {
            if (!validateRange(item.quantity)) {
                throw new Error('First number in range must be smaller than second.');
            }
        }
        incrementState(state, section);
        item.showDropdown = true;
        // Skip quantity with alphabetical characters
    } else if (item.quantity === null && /^[a-zA-Z]$/.test(char)) {
        incrementState(state, section, 2);
        item.showDropdown = true;
        setUnit(state, section, null, apply);
        handleSizeChange(opts);
        // Starting input should be a number
    } else if (item.quantity === null && /^[\d]$/.test(char)) {
        append(state, section, char);
        item.showDropdown = false;
        // Valid numerical input
    } else if (item.quantity !== null && /^[\d/.-]$/.test(char)) {
        append(state, section, char);
        item.showDropdown = false;
        // Throw error for invalid input
    } else {
        throw new Error('Only numbers and fractions are allowed when inputting a quantity.');
    }
}
const VALID_CHAR = /^[a-zA-Z ,.\-"]$/;
function handleUnitChange(opts: handleChangeOpts) {
    const { state, section, char, item, data, apply } = opts;
    if (VALID_CHAR.test(char)) {
        if (char === ' ') {
            const value = item.unit.value;
            for (const unit of data.units) {
                if (isPlural(item.quantity)) {
                    if (unit.longPlural === value || unit.shortPlural === value) {
                        setUnit(state, section, unit, apply);
                        incrementState(state, section);
                        return;
                    }
                } else {
                    if (unit.longSingular === value || unit.shortSingular === value) {
                        setUnit(state, section, unit, apply);
                        incrementState(state, section);
                        return;
                    }
                }
            }
            for (const size of data.sizes) {
                if (size.value === value) {
                    setSize(state, section, size);
                    incrementState(state, section, 'ingredient');
                    return;
                }
            }
        }
        append(state, section, char);
    } else {
        throw new Error('Invalid character.');
    }
}
function handleSizeChange(opts: handleChangeOpts) {
    const { state, section, char, item, data } = opts;
    if (VALID_CHAR.test(char)) {
        if (char === ' ') {
            const value = item.size.value;
            for (const size of data.sizes) {
                if (size.value === value) {
                    setSize(state, section, size);
                    incrementState(state, section);
                    return;
                }
            }
        }
        append(state, section, char);
    } else {
        throw new Error('Invalid character.');
    }
}
function handleOtherChange(opts: handleChangeOpts) {
    const { state, section, char } = opts;
    if (VALID_CHAR.test(char)) {
        append(state, section, char);
    } else {
        throw new Error('Invalid character.');
    }
}
function setPreviousState(editable: EditableRecipeIngredient) {
    switch (editable.state) {
        case 'quantity':
            break;
        case 'unit':
            editable.state = 'quantity';
            break;
        case 'size':
            if (editable.quantity === null) {
                // this is the scenario where quantity (and therefore unit) have been skipped.
                editable.state = 'quantity';
                break;
            }
            editable.unit.data = undefined;
            editable.state = 'unit';
            break;
        case 'ingredient':
            editable.size.data = undefined;
            editable.state = 'size';
            break;
        case 'prepMethod':
            editable.state = 'ingredient';
            break;
        default:
            break;
    }
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
    ingredientSections: [{ finished: [], editable: getEmptyIngredient() }],
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
                state.ingredientSections[section].editable = getEmptyIngredient();
            })
        ),
    resetIngredients: () => {
        set({
            ingredientSections: [{ finished: [], editable: getEmptyIngredient() }],
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
    getIngredientAttributeString: (section: number) => {
        const item = get().ingredientSections[section].editable;
        if (item.state === 'quantity') {
            return item.quantity ?? '';
        }
        return item[item.state].value ?? '';
    },
    setEditableIngredientAttribute: (
        section: number,
        attr: SetAttr,
        data: IngredientComponents | undefined,
        apply: ApplyUnitConversion
    ) =>
        set(
            produce((state: IngredientSectionsSlice) => {
                const inputState = state.ingredientSections[section].editable.state;
                if (typeof attr === 'string') {
                    if (inputState !== 'quantity') {
                        throw new Error('Cannot set string value after initial state');
                    }
                    setQuantity(state, section, attr);
                    incrementState(state, section);
                    return;
                }
                if (attr === null) {
                    switch (inputState) {
                        case 'quantity':
                            setQuantity(state, section, attr);
                            setUnit(state, section, attr, apply);
                            incrementState(state, section, 'size');
                            return;
                        case 'unit':
                            setUnit(state, section, attr, apply);
                            incrementState(state, section);
                            return;
                        case 'size':
                            setSize(state, section, attr);
                            incrementState(state, section);
                            return;
                        case 'prepMethod':
                            setPrepMethod(state, section, attr);
                            return;
                        default:
                            return;
                    }
                }
                if (attr === undefined) {
                    // this happens when enter is pressed on an empty dropdown list.
                    // is relevant for quantity change. should do nothing for other states.
                    if (inputState === 'quantity') {
                        if (!data) {
                            throw new Error('Could not load ingredient components');
                        }
                        const item = state.ingredientSections[section].editable;
                        const opts = { state, section, char: ' ', item, data, apply };
                        handleQuantityChange(opts);
                    }
                    return;
                }
                switch (attr.__typename) {
                    case 'Unit':
                        setUnit(state, section, attr, apply);
                        incrementState(state, section, 'size');
                        return;
                    case 'Size':
                        setSize(state, section, attr);
                        incrementState(state, section, 'ingredient');
                        return;
                    case 'Ingredient':
                    case 'Recipe':
                        setIngredient(state, section, attr);
                        incrementState(state, section, 'prepMethod');
                        return;
                    case 'PrepMethod':
                        setPrepMethod(state, section, attr);
                        return;
                    default:
                        break;
                }
            })
        ),
    removeIngredientCharacter: (section: number) => {
        set(
            produce((state: IngredientSectionsSlice) => {
                const item = state.ingredientSections[section].editable;
                if (item.state === 'quantity') {
                    const currentValue = item.quantity;
                    if (currentValue === null) {
                        return;
                    }
                    if (currentValue.length === 1) {
                        item.quantity = null;
                        item.showDropdown = true;
                    } else {
                        item.quantity = currentValue.slice(0, -1);
                    }
                } else {
                    const currentItem = item[item.state];
                    if (currentItem.value === null) {
                        item.popover = null;
                        if (item.state === 'unit' && item.quantity !== null) {
                            item.showDropdown = false;
                        }
                        setPreviousState(item);
                    } else if (currentItem.value.length === 1) {
                        currentItem.value = null;
                    } else {
                        currentItem.value = currentItem.value.slice(0, -1);
                    }
                }
            })
        );
    },
    handleIngredientChange: (
        section: number,
        value: string,
        data: IngredientComponents | undefined,
        apply: ApplyUnitConversion
    ) => {
        set(
            produce((state: IngredientSectionsSlice) => {
                const item = state.ingredientSections[section].editable;
                const char = getTextDiff(value, state.getIngredientString(section));
                if (!data) {
                    throw new Error('Could not load ingredient components');
                }
                const opts = { state, section, char, item, data, apply };
                switch (item.state) {
                    case 'quantity':
                        return handleQuantityChange(opts);
                    case 'unit':
                        return handleUnitChange(opts);
                    case 'size':
                        return handleSizeChange(opts);
                    case 'ingredient':
                    case 'prepMethod':
                        return handleOtherChange(opts);
                    default:
                        return;
                }
            })
        );
    },
    setFinishedIngredients: (section: number, ingredients: FinishedRecipeIngredient[]) =>
        set(
            produce((state: IngredientSectionsSlice) => {
                state.ingredientSections[section].finished = ingredients;
            })
        ),
    addIngredientSection: () =>
        set(
            produce((state: IngredientSectionsSlice) => {
                state.ingredientSections.push({ finished: [], editable: getEmptyIngredient() });
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
