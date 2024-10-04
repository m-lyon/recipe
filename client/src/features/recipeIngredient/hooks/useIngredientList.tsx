import { produce } from 'immer';
import { useReducer } from 'react';
import { useQuery } from '@apollo/client';

import { isPlural } from '@recipe/utils/plural';
import { useErrorToast } from '@recipe/common/hooks';
import { useUnitConversion } from '@recipe/features/servings';
import { GET_INGREDIENT_COMPONENTS } from '@recipe/graphql/queries/recipe';
import { VALID_NUMBER_REGEX, isRange, validateRange } from '@recipe/utils/number';
import { ingredientDisplayValue, unitDisplayValue } from '@recipe/utils/formatting';
import { getEditableRecipeIngredientStr, sizeDisplayValue } from '@recipe/utils/formatting';

export function dbIngredientToFinished(ingr: RecipeIngredientView): FinishedRecipeIngredient {
    const { quantity, unit, size, ingredient, prepMethod } = ingr;
    const key = crypto.randomUUID();
    if (
        quantity === undefined ||
        unit === undefined ||
        size === undefined ||
        ingredient == undefined ||
        prepMethod === undefined
    ) {
        throw new Error('One or more property is undefined');
    }
    return { key, quantity, unit, size, ingredient, prepMethod };
}

interface handleChangeOpts {
    subsection: number;
    char: string;
    item: EditableRecipeIngredient;
    data: CompletedIngredientComponentQuery;
    editableActions: InternalActionHandler;
}
function handleQuantityChange(opts: handleChangeOpts) {
    const { subsection, char, item, editableActions } = opts;
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
        editableActions.incrementState(subsection);
        editableActions.setShow.on(subsection);
        // Skip quantity with alphabetical characters
    } else if (item.quantity === null && /^[a-zA-Z]$/.test(char)) {
        editableActions.incrementState(subsection, 2);
        editableActions.setShow.on(subsection);
        editableActions.unit.set(subsection, null);
        handleSizeChange(opts);
        // Starting input should be a number
    } else if (item.quantity === null && /^[\d]$/.test(char)) {
        editableActions.quantity.append(subsection, char);
        if (item.show) {
            editableActions.setShow.off(subsection);
        }
        // Valid numerical input
    } else if (item.quantity !== null && /^[\d/.-]$/.test(char)) {
        editableActions.quantity.append(subsection, char);
        if (item.show) {
            editableActions.setShow.off(subsection);
        }
        // Throw error for invalid input
    } else {
        throw new Error('Only numbers and fractions are allowed when inputting a quantity.');
    }
}

function handleUnitChange(opts: handleChangeOpts) {
    const { subsection, char, item, data, editableActions } = opts;
    if (/^[a-zA-Z ]$/.test(char)) {
        if (char === ' ') {
            const value = item.unit.value;
            for (const unit of data.units) {
                if (isPlural(item.quantity)) {
                    if (unit.longPlural === value || unit.shortPlural === value) {
                        editableActions.unit.set(subsection, unit);
                        return editableActions.incrementState(subsection);
                    }
                } else {
                    if (unit.longSingular === value || unit.shortSingular === value) {
                        editableActions.unit.set(subsection, unit);
                        return editableActions.incrementState(subsection);
                    }
                }
            }
            for (const size of data.sizes) {
                if (size.value === value) {
                    editableActions.size.set(subsection, size);
                    return editableActions.incrementState(subsection, 'ingredient');
                }
            }
        }
        editableActions.unit.append(subsection, char);
    } else {
        throw new Error(
            'Only letters and spaces are allowed when inputting unit, size, or ingredient.'
        );
    }
}

function handleSizeChange(opts: handleChangeOpts) {
    const { subsection, char, item, data, editableActions } = opts;
    if (/^[a-zA-Z ]$/.test(char)) {
        if (char === ' ') {
            const value = item.size.value;
            for (const size of data.sizes) {
                if (size.value === value) {
                    editableActions.size.set(subsection, size);
                    return editableActions.incrementState(subsection);
                }
            }
        }
        editableActions.size.append(subsection, char);
    } else {
        throw new Error(`Only letters and spaces are allowed when inputting a size or ingredient.`);
    }
}

function handleIngredientChange(opts: handleChangeOpts) {
    const { subsection, char, editableActions } = opts;
    if (/^[a-zA-Z -]$/.test(char)) {
        editableActions.ingredient.append(subsection, char);
    } else {
        throw new Error('Only letters and spaces are allowed when inputting an ingredient.');
    }
}

function handlePrepMethodChange(opts: handleChangeOpts) {
    const { subsection, char, editableActions } = opts;
    if (/^[a-zA-Z ]$/.test(char)) {
        editableActions.prepMethod.append(subsection, char);
    } else {
        throw new Error(`Only letters and spaces are allowed when inputting a prep method.`);
    }
}

export function getTextDiff(value: string, origStr: string): string {
    if (value.length > origStr.length) {
        return value.replace(origStr, '');
    }
    return '';
}

type ShowStates = 'on' | 'off' | 'toggle';
type IngredientListState = EditableSubsection[];
interface EditableSubsection {
    name?: string;
    finished: FinishedRecipeIngredient[];
    editable: EditableRecipeIngredient;
}
// Helper functions -------------------------------------------------------------
function getEmptyIngredient(): EditableRecipeIngredient {
    return {
        quantity: null,
        unit: { value: null, data: undefined },
        size: { value: null, data: undefined },
        ingredient: { value: null, data: undefined },
        prepMethod: { value: null, data: undefined },
        state: 'quantity',
        show: false,
        key: crypto.randomUUID(),
    };
}
function setPrevState(editable: EditableRecipeIngredient) {
    switch (editable.state) {
        case 'quantity':
            break;
        case 'unit':
            editable.state = 'quantity';
            break;
        case 'size':
            if (editable.unit.value === null) {
                editable.state = 'quantity';
                break;
            }
            editable.unit.data = undefined;
            editable.state = 'unit';
            break;
        case 'ingredient':
            if (editable.size.value === null) {
                if (editable.unit.value === null) {
                    editable.state = 'quantity';
                    break;
                }
                editable.unit.data = undefined;
                editable.state = 'unit';
                break;
            }
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
function getActionSubsection(state: IngredientListState, action: GetSubsectionAction) {
    return getSubsection(state, action.subsection);
}
function getSubsection(state: IngredientListState, subsection: number): EditableSubsection {
    return state[subsection];
}
// Actions ---------------------------------------------------------------------
type Action =
    | RemoveFinishedItemAction
    | ResetEditableAction
    | SetShowAction
    | SetFinishedAction
    | AppendQuantityAction
    | AppendOtherRecipeIngredientComponentAction
    | SetQuantityAction
    | SetIngredientAction
    | SetUnitAction
    | SetSizeAction
    | SetPrepMethodAction
    | IncrementEditableStateAction
    | DeleteEditableCharAction
    | AddSubsectionAction
    | RemoveSubsectionAction
    | SetSubsectionTitleAction;
type GetSubsectionAction = Exclude<Action, AddSubsectionAction | RemoveSubsectionAction>;
interface RemoveFinishedItemAction {
    type: 'remove_finished_item';
    subsection: number;
    index: number;
}
function removeFinishedItem(
    state: IngredientListState,
    action: RemoveFinishedItemAction
): IngredientListState {
    return produce(state, (draft) => {
        const subsection = getActionSubsection(draft, action);
        subsection.finished.splice(action.index, 1);
    });
}
interface ResetEditableAction {
    type: 'reset_editable';
    subsection: number;
}
function resetEditable(
    state: IngredientListState,
    action: ResetEditableAction
): IngredientListState {
    return produce(state, (draft) => {
        const subsection = getActionSubsection(draft, action);
        subsection.editable = getEmptyIngredient();
    });
}
interface SetShowAction {
    type: 'set_editable_show';
    payload: ShowStates;
    subsection: number;
}
function setEditableShow(state: IngredientListState, action: SetShowAction): IngredientListState {
    return produce(state, (draft) => {
        const subsection = getActionSubsection(draft, action);
        _setEditableShow(subsection, action.payload);
    });
}
function _setEditableShow(subsection: EditableSubsection, state: ShowStates) {
    switch (state) {
        case 'on':
            subsection.editable.show = true;
            break;
        case 'off':
            subsection.editable.show = false;
            break;
        case 'toggle':
            subsection.editable.show = !subsection.editable.show;
            break;
        default:
            break;
    }
}
interface SetFinishedAction {
    type: 'set_finished';
    finished: FinishedRecipeIngredient[];
    subsection: number;
}
function setFinished(state: IngredientListState, action: SetFinishedAction): IngredientListState {
    return produce(state, (draft) => {
        const subsection = getActionSubsection(draft, action);
        subsection.finished = action.finished;
    });
}
interface SetQuantityAction {
    type: 'set_editable_quantity';
    payload: string | null;
    subsection: number;
}
function setQuantity(state: IngredientListState, action: SetQuantityAction): IngredientListState {
    return produce(state, (draft) => {
        const subsection = getActionSubsection(draft, action);
        subsection.editable.quantity = action.payload;
        if (subsection.editable.quantity === null) {
            subsection.editable.unit.value = null;
            subsection.editable.unit.data = null;
        }
    });
}
interface SetUnitAction {
    type: 'set_editable_unit';
    payload: FinishedUnit;
    subsection: number;
}
function setUnit(state: IngredientListState, action: SetUnitAction): IngredientListState {
    return produce(state, (draft) => {
        const subsection = getActionSubsection(draft, action);
        // Set data
        subsection.editable.unit.data = action.payload;
        // Set value
        if (subsection.editable.unit.data === null) {
            subsection.editable.unit.value = subsection.editable.unit.data;
        } else {
            subsection.editable.unit.value = unitDisplayValue(
                subsection.editable.quantity,
                subsection.editable.unit.data,
                true
            );
        }
    });
}
interface SetSizeAction {
    type: 'set_editable_size';
    payload: FinishedSize;
    subsection: number;
}
function setSize(state: IngredientListState, action: SetSizeAction): IngredientListState {
    return produce(state, (draft) => {
        const subsection = getActionSubsection(draft, action);
        // Set data
        subsection.editable.size.data = action.payload;
        // Set unit if skipping
        if (subsection.editable.unit.data === undefined) {
            subsection.editable.unit.value = null;
            subsection.editable.unit.data = null;
        }
        // Set value
        if (subsection.editable.size.data === null) {
            subsection.editable.size.value = subsection.editable.size.data;
        } else {
            subsection.editable.size.value = sizeDisplayValue(subsection.editable.size.data);
        }
    });
}
interface SetIngredientAction {
    type: 'set_editable_ingredient';
    payload: FinishedIngredient;
    subsection: number;
}
function setIngredient(
    state: IngredientListState,
    action: SetIngredientAction
): IngredientListState {
    return produce(state, (draft) => {
        const subsection = getActionSubsection(draft, action);
        // Set data
        subsection.editable.ingredient.data = action.payload;
        // Set unit & size if skipping
        if (subsection.editable.unit.data === undefined) {
            subsection.editable.unit.value = null;
            subsection.editable.unit.data = null;
        }
        if (subsection.editable.size.data === undefined) {
            subsection.editable.size.value = null;
            subsection.editable.size.data = null;
        }
        // Set value
        if (subsection.editable.ingredient.data === null) {
            subsection.editable.ingredient.value = null;
        } else {
            subsection.editable.ingredient.value = ingredientDisplayValue(
                subsection.editable.quantity,
                subsection.editable.unit.data,
                subsection.editable.ingredient.data
            );
        }
    });
}
interface SetPrepMethodAction {
    type: 'set_editable_prepMethod';
    payload: FinishedPrepMethod;
    subsection: number;
}
function setPrepMethod(
    state: IngredientListState,
    action: SetPrepMethodAction
): IngredientListState {
    return produce(state, (draft) => {
        const subsection = getActionSubsection(draft, action);
        // Set data
        subsection.editable.prepMethod.data = action.payload;
        // Set value
        if (subsection.editable.prepMethod.data === null) {
            subsection.editable.prepMethod.value = null;
        } else {
            subsection.editable.prepMethod.value = subsection.editable.prepMethod.data.value;
        }
        const ingredient = subsection.editable.ingredient;
        if (ingredient.data == null || ingredient.value == null) {
            // this should never happen
            console.log('[ERROR]: Ingredient data or value is null');
            return;
        }
        subsection.finished.push(
            getFinishedFromEditable({
                ...subsection.editable,
                ingredient: { data: ingredient.data, value: ingredient.value },
            })
        );
        subsection.editable = getEmptyIngredient();
    });
}
interface AppendQuantityAction {
    type: 'append_editable_quantity';
    payload: string;
    subsection: number;
}
function appendQuantity(
    state: IngredientListState,
    action: AppendQuantityAction
): IngredientListState {
    return produce(state, (draft) => {
        const subsection = getActionSubsection(draft, action);
        if (subsection.editable.quantity === null) {
            subsection.editable.quantity = action.payload;
        } else {
            subsection.editable.quantity += action.payload;
        }
    });
}
interface AppendOtherRecipeIngredientComponentAction {
    type:
        | 'append_editable_unit'
        | 'append_editable_size'
        | 'append_editable_ingredient'
        | 'append_editable_prepMethod';
    payload: string;
    subsection: number;
}
function appendOtherRecipeIngredientComponent(
    state: IngredientListState,
    action: AppendOtherRecipeIngredientComponentAction,
    property: Exclude<EditableState, 'quantity'>
): IngredientListState {
    return produce(state, (draft) => {
        const subsection = getActionSubsection(draft, action);
        if (subsection.editable[property].value === null) {
            subsection.editable[property].value = action.payload.toLowerCase();
        } else {
            subsection.editable[property].value += action.payload.toLowerCase();
        }
    });
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
interface IncrementEditableStateAction {
    type: 'increment_editable_state';
    subsection: number;
    increment: number | EditableState;
}
function incrementEditableState(
    state: IngredientListState,
    action: IncrementEditableStateAction
): IngredientListState {
    return produce(state, (draft) => {
        const subsection = getActionSubsection(draft, action);
        if (typeof action.increment === 'string') {
            subsection.editable.state = action.increment;
            return;
        }
        const currentState = subsection.editable.state;
        const max = Object.keys(STATES).length - 1;
        const newIndex = STATES_ORDER[currentState] + action.increment;
        subsection.editable.state = STATES[Math.min(newIndex, max)];
    });
}
interface DeleteEditableCharAction {
    type: 'delete_editable_char';
    subsection: number;
}
function deleteEditableChar(
    state: IngredientListState,
    action: DeleteEditableCharAction
): IngredientListState {
    return produce(state, (draft) => {
        const subsection = getActionSubsection(draft, action);
        const currentState = subsection.editable.state;
        if (currentState === 'quantity') {
            const currentValue = subsection.editable.quantity;
            if (currentValue === null) {
                return;
            }
            if (currentValue.length === 1) {
                subsection.editable.quantity = null;
                _setEditableShow(subsection, 'on');
            } else {
                subsection.editable.quantity = currentValue.slice(0, -1);
            }
        } else {
            const currentItem = subsection.editable[currentState];
            if (currentItem.value === null) {
                setPrevState(subsection.editable);
                if (currentState === 'unit' && subsection.editable.quantity !== null) {
                    _setEditableShow(subsection, 'off');
                }
            } else if (currentItem.value.length === 1) {
                currentItem.value = null;
            } else {
                currentItem.value = currentItem.value.slice(0, -1);
            }
        }
    });
}
function getFinishedFromEditable(
    editable: FinishableEditableRecipeIngredient
): FinishedRecipeIngredient {
    const finished = {
        key: editable.key,
        quantity: editable.quantity,
        unit: editable.unit.data ? editable.unit.data : null,
        size: editable.size.data ? editable.size.data : null,
        ingredient: editable.ingredient.data,
        prepMethod: editable.prepMethod.data ? editable.prepMethod.data : null,
    };
    return finished;
}
interface AddSubsectionAction {
    type: 'add_subsection';
}
interface RemoveSubsectionAction {
    type: 'remove_subsection';
    subsection: number;
}
interface SetSubsectionTitleAction {
    type: 'set_subsection_title';
    payload: string | undefined | null;
    subsection: number;
}
// Reducer ---------------------------------------------------------------------
function reducer(state: IngredientListState, action: Action): IngredientListState {
    switch (action.type) {
        case 'remove_finished_item': {
            return removeFinishedItem(state, action);
        }
        case 'reset_editable': {
            return resetEditable(state, action);
        }
        case 'set_editable_show': {
            return setEditableShow(state, action);
        }
        case 'set_editable_quantity': {
            return setQuantity(state, action);
        }
        case 'set_editable_unit': {
            return setUnit(state, action);
        }
        case 'set_editable_size': {
            return setSize(state, action);
        }
        case 'set_editable_ingredient': {
            return setIngredient(state, action);
        }
        case 'set_editable_prepMethod': {
            return setPrepMethod(state, action);
        }
        case 'set_finished': {
            return setFinished(state, action);
        }
        case 'append_editable_quantity': {
            return appendQuantity(state, action);
        }
        case 'append_editable_unit': {
            return appendOtherRecipeIngredientComponent(state, action, 'unit');
        }
        case 'append_editable_size': {
            return appendOtherRecipeIngredientComponent(state, action, 'size');
        }
        case 'append_editable_ingredient': {
            return appendOtherRecipeIngredientComponent(state, action, 'ingredient');
        }
        case 'append_editable_prepMethod': {
            return appendOtherRecipeIngredientComponent(state, action, 'prepMethod');
        }
        case 'increment_editable_state': {
            return incrementEditableState(state, action);
        }
        case 'delete_editable_char': {
            return deleteEditableChar(state, action);
        }
        case 'add_subsection': {
            return produce(state, (draft) => {
                draft.push({
                    finished: [],
                    editable: getEmptyIngredient(),
                });
            });
        }
        case 'remove_subsection': {
            return produce(state, (draft) => {
                draft.splice(action.subsection, 1);
            });
        }
        case 'set_subsection_title': {
            return produce(state, (draft) => {
                const subsection = getActionSubsection(draft, action);
                if (action.payload) {
                    subsection.name = action.payload;
                } else {
                    subsection.name = undefined;
                }
            });
        }
        default: {
            return state;
        }
    }
}

interface RecipeIngredientActionHandler<T> {
    set: (subsection: number, attr: T) => void;
    append: (subsection: number, value: string) => void;
}
interface InternalActionHandler {
    incrementState: (subsection: number, increment?: number | EditableState) => void;
    deleteChar: (subsection: number) => void;
    quantity: RecipeIngredientActionHandler<FinishedQuantity>;
    unit: RecipeIngredientActionHandler<FinishedUnit>;
    size: RecipeIngredientActionHandler<FinishedSize>;
    ingredient: RecipeIngredientActionHandler<FinishedIngredient>;
    prepMethod: RecipeIngredientActionHandler<FinishedPrepMethod>;
    setShow: SetShow;
}
interface SetShow {
    on: (subsection: number) => void;
    off: (subsection: number) => void;
    toggle: (subsection: number) => void;
}
interface SubsectionActions {
    add: () => void;
    remove: (subsection: number) => void;
    setTitle: (subsection: number, title: SetSubsectionTitleAction['payload']) => void;
}

export interface IngredientActionHandler {
    editableStringValue: (subsection: number) => string;
    resetEditable: (subsection: number) => void;
    setCurrentEditableAttribute: (subsection: number, attr: RecipeIngredientDropdown) => void;
    currentEditableAttributeValue: (subsection: number) => string | null;
    setEditableShow: SetShow;
    deleteChar: (subsection: number) => void;
    handleEditableChange: (subsection: number, value: string) => void;
    setFinishedArray: (subsection: number, finished: FinishedRecipeIngredient[]) => void;
    removeFinished: (subsection: number, index: number) => void;
    subsection: SubsectionActions;
}
export interface UseIngredientListReturnType {
    state: IngredientListState;
    actionHandler: IngredientActionHandler;
    queryData: IngredientComponentQuery;
}
export function useIngredientList(): UseIngredientListReturnType {
    const { data } = useQuery(GET_INGREDIENT_COMPONENTS);
    const { apply } = useUnitConversion();
    const [state, dispatch] = useReducer(reducer, [
        {
            finished: [],
            editable: getEmptyIngredient(),
        },
    ]);
    const toast = useErrorToast();
    const getIngredientActionHandler = (): IngredientActionHandler => {
        const editableActions: InternalActionHandler = {
            deleteChar: (subsection) => dispatch({ type: 'delete_editable_char', subsection }),
            incrementState: (subsection, increment = 1) =>
                dispatch({ type: 'increment_editable_state', subsection, increment }),
            quantity: {
                set: (subsection, quantity) =>
                    dispatch({ type: 'set_editable_quantity', payload: quantity, subsection }),
                append: (subsection, value) =>
                    dispatch({ type: 'append_editable_quantity', payload: value, subsection }),
            },
            unit: {
                set: (subsection, unit) => {
                    const sub = getSubsection(state, subsection);
                    const { quantity, unit: newUnit } = apply({
                        quantity: sub.editable.quantity,
                        unit,
                    });
                    dispatch({
                        type: 'set_editable_quantity',
                        payload: quantity,
                        subsection,
                    });
                    dispatch({
                        type: 'set_editable_unit',
                        payload: newUnit,
                        subsection,
                    });
                },
                append: (subsection, value) =>
                    dispatch({ type: 'append_editable_unit', payload: value, subsection }),
            },
            size: {
                set: (subsection, size) =>
                    dispatch({ type: 'set_editable_size', payload: size, subsection }),
                append: (subsection, value) =>
                    dispatch({ type: 'append_editable_size', payload: value, subsection }),
            },
            ingredient: {
                set: (subsection, ingredient) =>
                    dispatch({ type: 'set_editable_ingredient', payload: ingredient, subsection }),
                append: (subsection, value) =>
                    dispatch({ type: 'append_editable_ingredient', payload: value, subsection }),
            },
            prepMethod: {
                set: (subsection, prepMethod) =>
                    dispatch({ type: 'set_editable_prepMethod', payload: prepMethod, subsection }),
                append: (subsection, value) =>
                    dispatch({ type: 'append_editable_prepMethod', payload: value, subsection }),
            },
            setShow: {
                on: (subsection) =>
                    dispatch({ type: 'set_editable_show', payload: 'on', subsection }),
                off: (subsection) =>
                    dispatch({ type: 'set_editable_show', payload: 'off', subsection }),
                toggle: (subsection) =>
                    dispatch({ type: 'set_editable_show', payload: 'toggle', subsection }),
            },
        };

        const actionHandler: IngredientActionHandler = {
            editableStringValue: (subsection) => {
                const sub = getSubsection(state, subsection);
                return getEditableRecipeIngredientStr(sub.editable);
            },
            resetEditable: (subsection) => dispatch({ type: 'reset_editable', subsection }),
            setCurrentEditableAttribute: (subsection, attr) => {
                if (typeof attr === 'string') {
                    editableActions.quantity.set(subsection, attr);
                    return editableActions.incrementState(subsection);
                }
                if (attr === null) {
                    const sub = getSubsection(state, subsection);
                    switch (sub.editable.state) {
                        case 'quantity':
                            editableActions.quantity.set(subsection, attr);
                            editableActions.unit.set(subsection, attr);
                            return editableActions.incrementState(subsection, 'size');
                        case 'unit':
                            editableActions.unit.set(subsection, attr);
                            return editableActions.incrementState(subsection);
                        case 'size':
                            editableActions.size.set(subsection, attr);
                            return editableActions.incrementState(subsection);
                        case 'prepMethod':
                            editableActions.prepMethod.set(subsection, attr);
                            return;
                        default:
                            return;
                    }
                }
                switch (attr.__typename) {
                    case 'Unit':
                        editableActions.unit.set(subsection, attr);
                        return editableActions.incrementState(subsection, 'size');
                    case 'Size':
                        editableActions.size.set(subsection, attr);
                        return editableActions.incrementState(subsection, 'ingredient');
                    case 'Ingredient':
                        editableActions.ingredient.set(subsection, attr);
                        return editableActions.incrementState(subsection, 'prepMethod');
                    case 'PrepMethod':
                        return editableActions.prepMethod.set(subsection, attr);
                    default:
                        break;
                }
            },
            currentEditableAttributeValue: (subsection) => {
                const sub = getSubsection(state, subsection);
                if (sub.editable.state === 'quantity') {
                    return sub.editable.quantity;
                } else {
                    return sub.editable[sub.editable.state].value;
                }
            },
            setEditableShow: editableActions.setShow,
            deleteChar: (subsection) => dispatch({ type: 'delete_editable_char', subsection }),
            handleEditableChange: (subsection, value) => {
                const sub = getSubsection(state, subsection);
                const char = getTextDiff(value, getEditableRecipeIngredientStr(sub.editable));
                try {
                    if (!data) {
                        throw new Error('Could not load ingredient components');
                    }
                    const opts = { subsection, char, item: sub.editable, data, editableActions };
                    switch (sub.editable.state) {
                        case 'quantity':
                            return handleQuantityChange(opts);
                        case 'unit':
                            return handleUnitChange(opts);
                        case 'size':
                            return handleSizeChange(opts);
                        case 'ingredient':
                            return handleIngredientChange(opts);
                        case 'prepMethod':
                            return handlePrepMethodChange(opts);
                        default:
                            throw new Error(`Unknown state: ${sub.editable.state}`);
                    }
                } catch (e: unknown) {
                    if (e instanceof Error) {
                        toast({ title: 'Invalid input', description: e.message });
                    }
                }
            },
            setFinishedArray: (subsection, finished) =>
                dispatch({ type: 'set_finished', finished, subsection }),
            removeFinished: (subsection, index) =>
                dispatch({ type: 'remove_finished_item', index, subsection }),
            subsection: {
                add: () => dispatch({ type: 'add_subsection' }),
                remove: (subsection) => dispatch({ type: 'remove_subsection', subsection }),
                setTitle: (subsection, payload) =>
                    dispatch({ type: 'set_subsection_title', payload, subsection }),
            },
        };

        return actionHandler;
    };
    const actionHandler = getIngredientActionHandler();

    return { state, actionHandler, queryData: data };
}
