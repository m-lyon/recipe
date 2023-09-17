import { useReducer } from 'react';
import { produce } from 'immer';
import { strToNumber } from '../../../utils/number';

export const DEFAULT_INGREDIENT_STR = 'Enter ingredient';

const validateQuantity = (char: string, item: Ingredient): boolean => {
    if (char === ' ' && item.isEdited) {
        return true;
    }
    return !isNaN(parseInt(char)) || char === '/' || char === '.';
};

type NewChar = string | number;
function handleQuantityChange(
    char: NewChar,
    item: Ingredient,
    actionHandler: InternalActionHandler
) {
    if (typeof char === 'number') {
        console.log(`truncating by ${char} characters`);
        actionHandler.truncate(char);
    } else {
        if (validateQuantity(char, item)) {
            if (!item.isEdited) {
                actionHandler.toggleEdited();
                actionHandler.quantity.set(char);
            } else if (char === ' ') {
                console.log('changing state from "quantity" to "unit"');
                actionHandler.incrementState();
                actionHandler.setShow.on();
            } else {
                actionHandler.quantity.append(char);
            }
        } else {
            if (!item.isEdited) {
                actionHandler.quantity.set('');
                // Could do some red text warning here
            }
            console.log(`invalid char given: "${char}"`);
        }
    }
}

function handleOtherChange(
    inputState: InputState,
    char: NewChar,
    actionHandler: InternalActionHandler
) {
    if (typeof char === 'number') {
        console.log(`truncating by ${char} characters`);
        actionHandler.truncate(char);
    } else {
        if (/^[a-zA-Z ]$/.test(char)) {
            console.log('appending', char, 'to', inputState);
            actionHandler[inputState].append(char);
        } else {
            console.log(`invalid char given: "${char}"`);
        }
    }
}

export function getTextDiff(value: string, item: Ingredient, origStr: string): NewChar {
    // TODO: need to disallow copy and pasting
    if (!item.isEdited) {
        return value.replace(DEFAULT_INGREDIENT_STR, '');
    }
    if (value.length > origStr.length) {
        return value.replace(origStr, '');
    }
    if (value.length < origStr.length) {
        console.log('diff is', origStr.length - value.length);
        return origStr.length - value.length;
    }
    console.log('this shouldnt happen');
    return '';
}

interface Action {
    type: string;
    index?: number;
    value?: string;
    nullableValue?: string | null;
    _id?: string;
    start?: number;
    end?: number;
    num?: number;
    finished?: FinishedIngredient[];
}
export type DBInputState = 'unit' | 'name' | 'prepMethod';
export type InputState = 'quantity' | 'unit' | 'name' | 'prepMethod';
export interface EditableFromDB {
    value: string | null;
    _id?: string;
}
export interface Ingredient {
    quantity: string | null;
    unit: EditableFromDB;
    name: EditableFromDB;
    prepMethod: EditableFromDB;
    isEdited: boolean;
    state: InputState;
    show: boolean;
    key: string;
}
export interface FinishedName extends EditableFromDB {
    value: string;
    _id: string;
}
export interface FinishedIngredient {
    quantity: number;
    unit: EditableFromDB;
    name: FinishedName;
    prepMethod: EditableFromDB;
    key: string;
}
function getEmptyIngredient(): Ingredient {
    return {
        quantity: null,
        unit: { value: null },
        name: { value: null },
        prepMethod: { value: null },
        isEdited: false,
        state: 'quantity',
        show: false,
        key: crypto.randomUUID(),
    };
}

function setQuantity(state: IngredientState, action: Action): IngredientState {
    return produce(state, (draft) => {
        if (typeof action.nullableValue === 'undefined') {
            throw new Error('Cannot append quantity with undefined value.');
        }
        if (action.nullableValue === null) {
            throw new Error('Cannot set editable quantity to null.');
        }
        draft.editable.quantity = action.nullableValue;
    });
}

function setDBIngredientProperty(
    state: IngredientState,
    action: Action,
    property: DBInputState
): IngredientState {
    return produce(state, (draft) => {
        if (typeof action.nullableValue === 'undefined') {
            throw new Error(`Cannot set ${property} as undefined.`);
        }
        if (action.nullableValue === null && property === 'name') {
            throw new Error(`Cannot set name to null.`);
        }
        if (action.nullableValue !== null && action._id === undefined) {
            throw new Error(`Cannot set ${property} without _id.`);
        }
        draft.editable[property] = { value: action.nullableValue, _id: action._id };
    });
}

function appendQuantity(state: IngredientState, action: Action): IngredientState {
    return produce(state, (draft) => {
        if (typeof action.value === 'undefined') {
            throw new Error(`Cannot append quantity with undefined value.`);
        }
        if (draft.editable.quantity === null) {
            draft.editable.quantity = action.value;
        } else {
            draft.editable.quantity += action.value;
        }
    });
}

function appendDBIngredientProperty(
    state: IngredientState,
    action: Action,
    property: DBInputState
): IngredientState {
    return produce(state, (draft) => {
        if (typeof action.value === 'undefined') {
            throw new Error(`Cannot append editable ${property} with undefined value.`);
        }
        if (draft.editable[property].value === null) {
            draft.editable[property] = { value: action.value };
        } else {
            draft.editable[property].value += action.value;
        }
    });
}

function getPrevState(state: InputState): InputState {
    const nextState = { quantity: 'quantity', unit: 'quantity', name: 'unit', prepMethod: 'name' };
    return nextState[state] as InputState;
}

function removeFromQuantity(num: number, item: Ingredient): Ingredient {
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

function removeFromDBProperty(
    num: number,
    item: Ingredient,
    currentState: DBInputState
): [number, Ingredient] {
    if (num <= 0 || item.state !== currentState) {
        return [num, item];
    }
    const val = item[currentState].value;
    // Remove _id if present
    item[currentState]._id = undefined;

    // Current state is empty, decrement state and return item
    if (val === null) {
        console.log('current value is null, decrementing', num);
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

function truncateIngredient(num: number, item: Ingredient): Ingredient {
    let newItem = { ...item };

    [num, newItem] = removeFromDBProperty(num, newItem, 'prepMethod');
    [num, newItem] = removeFromDBProperty(num, newItem, 'name');
    [num, newItem] = removeFromDBProperty(num, newItem, 'unit');
    newItem = removeFromQuantity(num, newItem);

    return newItem;
}

function getQuantityStr(item: Ingredient): string {
    return `${item.quantity !== null ? item.quantity : DEFAULT_INGREDIENT_STR}`;
}

function getUnitStr(item: Ingredient): string {
    if (item.state === 'quantity') {
        return '';
    }
    if (item.state === 'unit') {
        if (item.unit.value === null) {
            return ' ';
        } else {
            return ` ${item.unit.value}`;
        }
    } else {
        if (item.unit.value === null) {
            return '';
        } else {
            return ` ${item.unit.value}`;
        }
    }
}

function getNameStr(item: Ingredient): string {
    const delim = ['name', 'prepMethod'].includes(item.state) ? ' ' : '';
    const str = item.name.value !== null ? item.name.value : '';
    return `${delim}${str}`;
}

function getPrepMethodStr(item: Ingredient): string {
    const delim = item.state === 'prepMethod' && item.prepMethod.value !== null ? ', ' : '';
    const str = item.prepMethod.value !== null ? item.prepMethod.value : '';
    return `${delim}${str}`;
}

function getIngredientStr(item: Ingredient): string {
    if (item.quantity === null && item.isEdited) {
        return '';
    }
    const quantityStr = getQuantityStr(item);
    const unitStr = getUnitStr(item);
    const nameStr = getNameStr(item);
    const prepMethodStr = getPrepMethodStr(item);
    return `${quantityStr}${unitStr}${nameStr}${prepMethodStr}`;
}

export function getFinishedIngredientStr(item: FinishedIngredient): string {
    const unitStr = item.unit.value === null ? '' : ` ${item.unit.value}`;
    const prepMethodStr = item.prepMethod.value === null ? '' : `, ${item.prepMethod.value}`;
    return `${item.quantity}${unitStr} ${item.name.value}${prepMethodStr}`;
}

type ShowStates = 'on' | 'off' | 'toggle';
interface IngredientState {
    finished: FinishedIngredient[];
    editable: Ingredient;
}

function itemsReducer(state: IngredientState, action: Action): IngredientState {
    switch (action.type) {
        case 'remove_finished_item': {
            return produce(state, (draft) => {
                if (typeof action.index === 'undefined') {
                    throw new Error('index is required to remove finished ingredient.');
                }
                draft.finished.splice(action.index, 1);
            });
        }
        case 'reset_editable': {
            console.log('reset item called');
            return produce(state, (draft) => {
                draft.editable = getEmptyIngredient();
            });
        }
        case 'set_editable_show': {
            return produce(state, (draft) => {
                if (typeof action.value === 'undefined') {
                    throw new Error('num is required to truncate item');
                }
                if (!['on', 'off', 'toggle'].includes(action.value)) {
                    throw new Error('invalid show value given');
                }
                const newState = { on: true, off: false, toggle: !draft.editable.show };
                draft.editable.show = newState[action.value as ShowStates];
            });
        }
        case 'set_editable_quantity': {
            return setQuantity(state, action);
        }
        case 'set_editable_unit': {
            return setDBIngredientProperty(state, action, 'unit');
        }
        case 'set_editable_name': {
            return setDBIngredientProperty(state, action, 'name');
        }
        case 'set_editable_prepMethod': {
            return setDBIngredientProperty(state, action, 'prepMethod');
        }
        case 'set_finished': {
            return produce(state, (draft) => {
                if (typeof action.finished === 'undefined') {
                    throw new Error('finished array cannot be undefined');
                }
                draft.finished = action.finished;
            });
        }
        case 'append_editable_quantity': {
            return appendQuantity(state, action);
        }
        case 'append_editable_unit': {
            return appendDBIngredientProperty(state, action, 'unit');
        }
        case 'append_editable_name': {
            return appendDBIngredientProperty(state, action, 'name');
        }
        case 'append_editable_prepMethod': {
            return appendDBIngredientProperty(state, action, 'prepMethod');
        }
        case 'toggle_editable_is_edited': {
            return produce(state, (draft) => {
                draft.editable.isEdited = !draft.editable.isEdited;
            });
        }
        case 'increment_editable_state': {
            return produce(state, (draft) => {
                const nextState = {
                    quantity: 'unit',
                    unit: 'name',
                    name: 'prepMethod',
                    prepMethod: 'prepMethod',
                };
                console.log('incrementing state to', nextState[draft.editable.state]);
                draft.editable.state = nextState[draft.editable.state] as InputState;
            });
        }
        case 'truncate_editable': {
            return produce(state, (draft) => {
                if (typeof action.num === 'undefined') {
                    throw new Error('num is required to truncate item');
                }
                draft.editable = truncateIngredient(action.num, draft.editable);
            });
        }
        case 'submit_editable': {
            return produce(state, (draft) => {
                if (draft.editable.name === null) {
                    throw new Error('Cannot submit an item with null name.');
                }
                const finished = {
                    key: draft.editable.key,
                    quantity: strToNumber(draft.editable.quantity as string),
                    unit: draft.editable.unit,
                    name: draft.editable.name as FinishedName,
                    prepMethod: draft.editable.prepMethod,
                };
                console.log('submitted value:', finished);
                draft.finished.push(finished);
                draft.editable = getEmptyIngredient();
            });
        }
        default: {
            throw Error('Unknown action: ' + action.type);
        }
    }
}

interface ActionTypeHandler {
    set: (value: string | null) => void;
    append: (value: string) => void;
}
interface ActionTypeHandlerFromDB extends Omit<ActionTypeHandler, 'set'> {
    set: (value: string | null, _id?: string) => void;
}
interface InternalActionHandler {
    incrementState: () => void;
    submit: () => void;
    truncate: (num: number) => void;
    toggleEdited: () => void;
    quantity: ActionTypeHandler;
    unit: ActionTypeHandlerFromDB;
    name: ActionTypeHandlerFromDB;
    prepMethod: ActionTypeHandlerFromDB;
    reset: () => void;
    setShow: SetShow;
}
interface Get {
    string: () => string;
    currentStateValue: () => string | null;
}
interface SetShow {
    on: () => void;
    off: () => void;
    toggle: () => void;
}
interface Set {
    currentStateItem: (value: string | null, _id?: string) => void;
    show: SetShow;
}
export interface IngredientActionHandler {
    get: Get;
    set: Set;
    handleSubmit: (value: string) => void;
    handleChange: (value: string) => void;
}
export interface UseIngredientListReturnType {
    state: IngredientState;
    actionHandler: IngredientActionHandler;
    setFinished: (finished: FinishedIngredient[]) => void;
    removeFinished: (index: number) => void;
}
export function useEditableIngredients(): UseIngredientListReturnType {
    const [state, dispatch] = useReducer(itemsReducer, {
        finished: [],
        editable: getEmptyIngredient(),
    });

    const getIngredientActionHandler = (): IngredientActionHandler => {
        const editableActions: InternalActionHandler = {
            reset: () => dispatch({ type: 'reset_editable' }),
            submit: () => dispatch({ type: 'submit_editable' }),
            truncate: (num: number) => dispatch({ type: 'truncate_editable', num }),
            toggleEdited: () => dispatch({ type: 'toggle_editable_is_edited' }),
            incrementState: () => dispatch({ type: 'increment_editable_state' }),
            quantity: {
                set: (nullableValue: string | null) =>
                    dispatch({ type: 'set_editable_quantity', nullableValue }),
                append: (value: string) => dispatch({ type: 'append_editable_quantity', value }),
            },
            unit: {
                set: (nullableValue: string | null, _id?: string) =>
                    dispatch({ type: 'set_editable_unit', nullableValue, _id }),
                append: (value: string) => dispatch({ type: 'append_editable_unit', value }),
            },
            name: {
                set: (nullableValue: string | null, _id?: string) =>
                    dispatch({ type: 'set_editable_name', nullableValue, _id }),
                append: (value: string) => dispatch({ type: 'append_editable_name', value }),
            },
            prepMethod: {
                set: (nullableValue: string | null, _id?: string) =>
                    dispatch({ type: 'set_editable_prepMethod', nullableValue, _id }),
                append: (value: string) => dispatch({ type: 'append_editable_prepMethod', value }),
            },
            setShow: {
                on: () => dispatch({ type: 'set_editable_show', value: 'on' }),
                off: () => dispatch({ type: 'set_editable_show', value: 'off' }),
                toggle: () => dispatch({ type: 'set_editable_show', value: 'toggle' }),
            },
        };

        // Public functions
        const get: Get = {
            string: () => getIngredientStr(state.editable),
            currentStateValue: () => {
                if (state.editable.state === 'quantity') {
                    return state.editable.quantity;
                } else {
                    return state.editable[state.editable.state].value;
                }
            },
        };
        const handleSubmit = () => {
            if (state.editable.state !== 'prepMethod') {
                console.log('ingredient not finished, resetting.');
                editableActions.reset();
            } else {
                editableActions.setShow.off();
                editableActions.submit();
            }
        };
        const set: Set = {
            currentStateItem: (value: string | null, _id?: string) => {
                if (state.editable.state === 'quantity') {
                    editableActions.quantity.set(value);
                } else {
                    editableActions[state.editable.state].set(value, _id);
                }
                editableActions.incrementState();
            },
            show: editableActions.setShow,
        };
        const handleChange = (value: string) => {
            console.log('current state', state.editable.state);
            const diff = getTextDiff(value, state.editable, get.string());
            if (state.editable.state === 'quantity') {
                return handleQuantityChange(diff, state.editable, editableActions);
            }
            return handleOtherChange(state.editable.state, diff, editableActions);
        };

        return { get, set, handleSubmit, handleChange };
    };
    const actionHandler = getIngredientActionHandler();
    const setFinished = (finished: FinishedIngredient[]) => {
        return dispatch({ type: 'set_finished', finished });
    };
    const removeFinished = (index: number) => {
        return dispatch({ type: 'remove_finished_item', index });
    };

    return {
        state,
        actionHandler,
        setFinished,
        removeFinished,
    };
}
