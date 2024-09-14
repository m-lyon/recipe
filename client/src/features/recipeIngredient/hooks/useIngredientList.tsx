import { produce } from 'immer';
import { useReducer } from 'react';
import { useQuery } from '@apollo/client';

import { IngredientAndRecipe, InputState } from '@recipe/types';
import { isPlural } from '@recipe/utils/plural';
import { useErrorToast } from '@recipe/common/hooks';
import { VALID_NUMBER_REGEX } from '@recipe/utils/number';
import { useUnitConversion } from '@recipe/features/servings';
import { GET_INGREDIENT_COMPONENTS } from '@recipe/graphql/queries/recipe';
import { ingredientDisplayStr, unitDisplayValue } from '@recipe/utils/formatting';
import { RecipeFromIngredientsMany, RecipeIngredientQueryData } from '@recipe/types';
import { getEditableRecipeIngredientStr, sizeDisplayValue } from '@recipe/utils/formatting';
import { EditableRecipeIngredient, FinishedRecipeIngredient, Quantity } from '@recipe/types';
import { Ingredient, PrepMethod, RecipeIngredient, Size, Unit } from '@recipe/graphql/generated';

export function dbIngredientToFinished(ingr: RecipeIngredient): FinishedRecipeIngredient {
    const { quantity, unit, size, ingredient, prepMethod } = ingr;
    const key = crypto.randomUUID();
    if (
        quantity == undefined ||
        unit == undefined ||
        size == undefined ||
        ingredient == undefined ||
        prepMethod == undefined
    ) {
        throw new Error('One or more property is undefined');
    }
    return { key, quantity, unit, size, ingredient, prepMethod };
}

type NewChar = string | number;
function handleQuantityChange(
    subsection: number,
    char: NewChar,
    item: EditableRecipeIngredient,
    actionHandler: InternalActionHandler
) {
    if (typeof char === 'number') {
        actionHandler.truncate(subsection, char);
    } else {
        // Validate quantity upon completion
        if (char === ' ' && item.quantity !== null) {
            if (!VALID_NUMBER_REGEX.test(item.quantity)) {
                throw new Error('Invalid quantity.');
            } else {
                actionHandler.incrementState(subsection);
                actionHandler.setShow.on(subsection);
            }
            // Skip quantity with alphabetical characters
        } else if (item.quantity === null && /^[a-zA-Z]$/.test(char)) {
            actionHandler.incrementState(subsection, 2);
            actionHandler.setShow.on(subsection);
            actionHandler.unit.set(subsection, null);
            handleIngredientChange(subsection, char, actionHandler);
            // Starting input should be a number
        } else if (item.quantity === null && /^[\d]$/.test(char)) {
            actionHandler.quantity.append(subsection, char);
            if (item.show) {
                actionHandler.setShow.off(subsection);
            }
            // Valid numerical input
        } else if (item.quantity !== null && /^[\d/.-]$/.test(char)) {
            actionHandler.quantity.append(subsection, char);
            if (item.show) {
                actionHandler.setShow.off(subsection);
            }
            // Throw error for invalid input
        } else {
            throw new Error('Only numbers and fractions are allowed when inputting a quantity.');
        }
    }
}

function handleUnitChange(
    subsection: number,
    char: NewChar,
    item: EditableRecipeIngredient,
    data: RecipeIngredientQueryData,
    actionHandler: InternalActionHandler
) {
    if (typeof char === 'number') {
        actionHandler.truncate(subsection, char);
    } else {
        if (/^[a-zA-Z ]$/.test(char)) {
            if (char === ' ' && item.unit.value !== null) {
                if (!data) {
                    throw new Error('Could not load ingredient components');
                }
                const unitValue = item.unit.value;
                for (const unit of data.units) {
                    if (isPlural(item.quantity)) {
                        if (unit.longPlural === unitValue || unit.shortPlural === unitValue) {
                            actionHandler.unit.set(subsection, unit);
                            return actionHandler.incrementState(subsection);
                        }
                    } else {
                        if (unit.longSingular === unitValue || unit.shortSingular === unitValue) {
                            actionHandler.unit.set(subsection, unit);
                            return actionHandler.incrementState(subsection);
                        }
                    }
                }
            }
            actionHandler.unit.append(subsection, char);
        } else {
            throw new Error(
                'Only letters and spaces are allowed when inputting unit, size, or ingredient.'
            );
        }
    }
}

function handleSizeChange(subsection: number, char: NewChar, actionHandler: InternalActionHandler) {
    if (typeof char === 'number') {
        actionHandler.truncate(subsection, char);
    } else {
        if (/^[a-zA-Z ]$/.test(char)) {
            actionHandler.size.append(subsection, char);
        } else {
            throw new Error(
                `Only letters and spaces are allowed when inputting a size or ingredient.`
            );
        }
    }
}

function handleIngredientChange(
    subsection: number,
    char: NewChar,
    actionHandler: InternalActionHandler
) {
    if (typeof char === 'number') {
        actionHandler.truncate(subsection, char);
    } else {
        if (/^[a-zA-Z -]$/.test(char)) {
            actionHandler.ingredient.append(subsection, char);
        } else {
            throw new Error('Only letters and spaces are allowed when inputting an ingredient.');
        }
    }
}

function handlePrepMethodChange(
    subsection: number,
    char: NewChar,
    actionHandler: InternalActionHandler
) {
    if (typeof char === 'number') {
        actionHandler.truncate(subsection, char);
    } else {
        if (/^[a-zA-Z ]$/.test(char)) {
            actionHandler.prepMethod.append(subsection, char);
        } else {
            throw new Error(`Only letters and spaces are allowed when inputting a prep method.`);
        }
    }
}

export function getTextDiff(value: string, origStr: string): NewChar {
    if (value.length > origStr.length) {
        return value.replace(origStr, '');
    }
    if (value.length < origStr.length) {
        return origStr.length - value.length;
    }
    return '';
}

export type DBInputState = 'unit' | 'size' | 'ingredient' | 'prepMethod';

type ShowStates = 'on' | 'off' | 'toggle';
type IngredientListState = Subsection[];
interface Subsection {
    name?: string;
    finished: FinishedRecipeIngredient[];
    editable: EditableRecipeIngredient;
}
// Helper functions -------------------------------------------------------------
function getEmptyIngredient(): EditableRecipeIngredient {
    return {
        quantity: null,
        unit: { value: null },
        size: { value: null },
        ingredient: { value: null },
        prepMethod: { value: null },
        state: 'quantity',
        show: false,
        key: crypto.randomUUID(),
    };
}
function getPrevState(state: InputState): InputState {
    const nextState = {
        quantity: 'quantity',
        unit: 'quantity',
        size: 'unit',
        ingredient: 'size',
        prepMethod: 'ingredient',
    };
    return nextState[state] as InputState;
}
function removeFromQuantity(num: number, item: EditableRecipeIngredient): EditableRecipeIngredient {
    if (num <= 0 || item.state !== 'quantity') {
        return item;
    }

    // number to delete is greater or equal, reset val
    if (item.quantity === null || num >= item.quantity.length) {
        item.quantity = null;
        return item;
    }
    // number to delete is within current state value
    item.quantity = item.quantity.slice(0, item.quantity.length - num);
    return item;
}
function removeFromProperty(
    num: number,
    item: EditableRecipeIngredient,
    currentState: DBInputState
): [number, EditableRecipeIngredient] {
    // TODO: make this function decrement state to quantity if unit/size are null. (need to
    // make sure that the data is reset to undefined)
    if (num <= 0 || item.state !== currentState) {
        return [num, item];
    }
    const val = item[currentState].value;
    // Remove data if present
    item[currentState].data = undefined;

    // Current state is empty, decrement state and return item
    if (val === null) {
        item.state = getPrevState(currentState);
        num--;
        return [num, item];
    }
    // number to delete is greater than current state, reset val and decrement state
    if (num > val.length) {
        item[currentState].value = null;
        item.state = getPrevState(currentState);
        return [num - val.length - 1, item];
    }
    // number is equal, just reset val
    if (num === val.length) {
        item[currentState].value = null;
        return [num - val.length, item];
    }
    // number to delete is within current state value
    item[currentState].value = val.slice(0, val.length - num);
    return [0, item];
}
function getActionSubsection(state: IngredientListState, action: GetSubsectionAction) {
    return getSubsection(state, action.subsection);
}
function getSubsection(state: IngredientListState, subsection: number) {
    if (state.length <= subsection) {
        throw new Error('Invalid subsection index');
    }
    return state[subsection];
}
// Actions ---------------------------------------------------------------------
type Action =
    | RemoveFinishedItemAction
    | ResetEditableAction
    | SetShowAction
    | SetFinishedAction
    | AppendQuantityAction
    | AppendOtherIngredientAction
    | SetQuantityAction
    | SetIngredientAction
    | SetUnitAction
    | SetSizeAction
    | SetPrepMethodAction
    | IncrementEditableStateAction
    | DecrementEditableStateAction
    | SubmitEditableAction
    | TruncateEditableAction
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
        switch (action.payload) {
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
    });
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
    payload: Unit | null;
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
                subsection.editable.unit.data!,
                true
            );
        }
    });
}
interface SetSizeAction {
    type: 'set_editable_size';
    payload: Size | null;
    subsection: number;
}
function setSize(state: IngredientListState, action: SetSizeAction): IngredientListState {
    return produce(state, (draft) => {
        const subsection = getActionSubsection(draft, action);
        // Set data
        subsection.editable.size.data = action.payload;
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
    payload: Ingredient | RecipeFromIngredientsMany;
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
        // Set value
        if (subsection.editable.ingredient.data === null) {
            subsection.editable.ingredient.value = null;
        } else {
            subsection.editable.ingredient.value = ingredientDisplayStr(
                subsection.editable.quantity,
                subsection.editable.unit.data!,
                subsection.editable.ingredient.data
            );
        }
    });
}
interface SetPrepMethodAction {
    type: 'set_editable_prepMethod';
    payload: PrepMethod | null;
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
interface AppendOtherIngredientAction {
    type:
        | 'append_editable_unit'
        | 'append_editable_size'
        | 'append_editable_ingredient'
        | 'append_editable_prepMethod';
    payload: string;
    subsection: number;
}
function appendOtherIngredient(
    state: IngredientListState,
    action: AppendOtherIngredientAction,
    property: DBInputState
): IngredientListState {
    return produce(state, (draft) => {
        const subsection = getActionSubsection(draft, action);
        if (subsection.editable[property].value === null) {
            subsection.editable[property] = { value: action.payload.toLowerCase() };
        } else {
            subsection.editable[property].value += action.payload.toLowerCase();
        }
    });
}
const states: { [key: number]: InputState } = {
    0: 'quantity',
    1: 'unit',
    2: 'size',
    3: 'ingredient',
    4: 'prepMethod',
};
interface IncrementEditableStateAction {
    type: 'increment_editable_state';
    subsection: number;
    increment?: number | InputState;
}
function incrementEditableState(
    state: IngredientListState,
    action: IncrementEditableStateAction,
    increment: number | InputState = 1
): IngredientListState {
    return produce(state, (draft) => {
        const subsection = getActionSubsection(draft, action);
        if (typeof increment === 'string') {
            subsection.editable.state = increment;
            return;
        }
        const currentState = subsection.editable.state;
        const currentIndex = Object.keys(states).find((key) => states[+key] === currentState);
        if (currentIndex === undefined) {
            return;
        }
        const max = Object.keys(states).length - 1;
        const newIndex = parseInt(currentIndex) + increment;
        subsection.editable.state = states[Math.min(newIndex, max)];
    });
}

interface DecrementEditableStateAction {
    type: 'decrement_editable_state';
    subsection: number;
    decrement?: number | InputState;
}
function decrementEditableState(
    state: IngredientListState,
    action: DecrementEditableStateAction,
    decrement: number | InputState = 1
): IngredientListState {
    return produce(state, (draft) => {
        const subsection = getActionSubsection(draft, action);
        if (typeof decrement === 'string') {
            subsection.editable.state = decrement;
            return;
        }
        const currentState = subsection.editable.state;
        const currentIndex = Object.keys(states).find((key) => states[+key] === currentState);
        if (currentIndex === undefined) {
            return;
        }
        const newIndex = parseInt(currentIndex) - decrement;
        subsection.editable.state = states[Math.max(newIndex, 0)];
    });
}
interface TruncateEditableAction {
    type: 'truncate_editable';
    payload: number;
    subsection: number;
}
function truncateEditable(
    state: IngredientListState,
    action: TruncateEditableAction
): IngredientListState {
    return produce(state, (draft) => {
        const subsection = getActionSubsection(draft, action);
        let newItem = { ...subsection.editable };
        [action.payload, newItem] = removeFromProperty(action.payload, newItem, 'prepMethod');
        [action.payload, newItem] = removeFromProperty(action.payload, newItem, 'ingredient');
        [action.payload, newItem] = removeFromProperty(action.payload, newItem, 'unit');
        newItem = removeFromQuantity(action.payload, newItem);
        subsection.editable = newItem;
    });
}
interface SubmitEditableAction {
    type: 'submit_editable';
    subsection: number;
}
function submitEditable(
    state: IngredientListState,
    action: SubmitEditableAction
): IngredientListState {
    return produce(state, (draft) => {
        const subsection = getActionSubsection(draft, action);
        if (subsection.editable.unit.data === undefined) {
            subsection.editable.unit.data = null;
        }
        if (subsection.editable.size.data === undefined) {
            subsection.editable.size.data = null;
        }
        if (subsection.editable.ingredient.data === undefined) {
            throw new Error('Cannot submit an item with no ingredient.');
        }
        if (subsection.editable.prepMethod.data === undefined) {
            subsection.editable.prepMethod.data = null;
        }
        const finished = {
            key: subsection.editable.key,
            quantity: subsection.editable.quantity,
            unit: subsection.editable.unit.data,
            size: subsection.editable.size.data,
            ingredient: subsection.editable.ingredient.data,
            prepMethod: subsection.editable.prepMethod.data,
        };
        subsection.finished.push(finished);
        subsection.editable = getEmptyIngredient();
    });
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
            return appendOtherIngredient(state, action, 'unit');
        }
        case 'append_editable_size': {
            return appendOtherIngredient(state, action, 'size');
        }
        case 'append_editable_ingredient': {
            return appendOtherIngredient(state, action, 'ingredient');
        }
        case 'append_editable_prepMethod': {
            return appendOtherIngredient(state, action, 'prepMethod');
        }
        case 'increment_editable_state': {
            return incrementEditableState(state, action);
        }
        case 'decrement_editable_state': {
            return decrementEditableState(state, action);
        }
        case 'truncate_editable': {
            return truncateEditable(state, action);
        }
        case 'submit_editable': {
            return submitEditable(state, action);
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
            throw Error('Unknown action type');
        }
    }
}

interface RecipeIngredientActionHandler<T> {
    set: (subsection: number, attr: T) => void;
    append: (subsection: number, value: string) => void;
}
interface InternalActionHandler {
    incrementState: (subsection: number, increment?: number | InputState) => void;
    decrementState: (subsection: number, decrement?: number | InputState) => void;
    submit: (subsection: number) => void;
    truncate: (subsection: number, num: number) => void;
    quantity: RecipeIngredientActionHandler<Quantity>;
    unit: RecipeIngredientActionHandler<Unit | null>;
    size: RecipeIngredientActionHandler<Size | null>;
    ingredient: RecipeIngredientActionHandler<Ingredient>;
    prepMethod: RecipeIngredientActionHandler<PrepMethod | null>;
    reset: (subsection: number) => void;
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
export type SetAttr = Quantity | Unit | Size | IngredientAndRecipe | PrepMethod;
export interface IngredientActionHandler {
    editableStringValue: (subsection: number) => string;
    resetEditable: (subsection: number) => void;
    setCurrentEditableAttribute: (subsection: number, attr: SetAttr) => void;
    currentEditableAttributeValue: (subsection: number) => string | null;
    setEditableShow: SetShow;
    handleEditableSubmit: (subsection: number) => void;
    handleEditableChange: (subsection: number, value: string) => void;
    decrementEditableState: (subsection: number, decrement?: InputState) => void;
    setFinishedArray: (subsection: number, finished: FinishedRecipeIngredient[]) => void;
    removeFinished: (subsection: number, index: number) => void;
    subsection: SubsectionActions;
}
export interface UseIngredientListReturnType {
    state: IngredientListState;
    actionHandler: IngredientActionHandler;
    queryData: RecipeIngredientQueryData;
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
            reset: (subsection) => dispatch({ type: 'reset_editable', subsection }),
            submit: (subsection) => dispatch({ type: 'submit_editable', subsection }),
            truncate: (subsection, num) =>
                dispatch({ type: 'truncate_editable', payload: num, subsection }),
            incrementState: (subsection, increment) =>
                dispatch({ type: 'increment_editable_state', subsection, increment }),
            decrementState: (subsection, decrement) =>
                dispatch({ type: 'decrement_editable_state', subsection, decrement }),
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
            resetEditable: editableActions.reset,
            setCurrentEditableAttribute: (subsection, attr) => {
                if (typeof attr === 'string') {
                    editableActions.quantity.set(subsection, attr);
                    return editableActions.incrementState(subsection);
                }
                switch (attr?.__typename) {
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
            handleEditableSubmit: (subsection) => {
                const sub = getSubsection(state, subsection);
                if (sub.editable.state !== 'prepMethod') {
                    editableActions.reset(subsection);
                } else {
                    editableActions.setShow.off(subsection);
                    editableActions.submit(subsection);
                }
            },
            handleEditableChange: (subsection, value) => {
                const sub = getSubsection(state, subsection);
                const diff = getTextDiff(value, getEditableRecipeIngredientStr(sub.editable));
                try {
                    switch (sub.editable.state) {
                        case 'quantity':
                            return handleQuantityChange(
                                subsection,
                                diff,
                                sub.editable,
                                editableActions
                            );
                        case 'unit':
                            return handleUnitChange(
                                subsection,
                                diff,
                                sub.editable,
                                data,
                                editableActions
                            );
                        case 'size':
                            return handleSizeChange(subsection, diff, editableActions);
                        case 'ingredient':
                            return handleIngredientChange(subsection, diff, editableActions);
                        case 'prepMethod':
                            return handlePrepMethodChange(subsection, diff, editableActions);
                        default:
                            throw new Error(`Unknown state: ${sub.editable.state}`);
                    }
                } catch (e: unknown) {
                    if (e instanceof Error) {
                        toast({ title: 'Invalid input', description: e.message });
                    }
                }
            },
            decrementEditableState: editableActions.decrementState,
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
