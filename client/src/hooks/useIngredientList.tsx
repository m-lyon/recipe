import { useReducer } from 'react';
import { produce } from 'immer';

export const DEFAULT_INGREDIENT_STR = 'Enter ingredient';

const validateAmount = (char: string, item: Ingredient): boolean => {
    if (char === ' ' && item.isEdited) {
        return true;
    }
    return !isNaN(parseInt(char)) || char === '/';
};
const validateUnit = (char: string): boolean => /^[a-zA-Z ]$/.test(char);
const validateName = (char: string): boolean => /^[a-zA-Z ]$/.test(char);

type NewChar = string | number;
function handleAmountChange(
    char: NewChar,
    item: Ingredient,
    actionHandler: InternalEditableActionHandler
) {
    if (typeof char === 'number') {
        console.log(`truncating by ${char} characters`);
        actionHandler.truncate(char);
    } else {
        if (validateAmount(char, item)) {
            if (!item.isEdited) {
                actionHandler.toggleEdited();
                actionHandler.amount.set(char);
            } else if (char === ' ') {
                console.log('changing state from "amnt" to "unit"');
                actionHandler.incrementState();
                actionHandler.setShow.on();
            } else {
                actionHandler.amount.append(char);
            }
        } else {
            if (!item.isEdited) {
                actionHandler.amount.set('');
                // Could do some red text warning here
            }
            console.log(`invalid char given: "${char}"`);
        }
    }
}

function handleUnitChange(char: NewChar, actionHandler: InternalEditableActionHandler) {
    if (typeof char === 'number') {
        console.log(`truncating by ${char} characters`);
        actionHandler.truncate(char);
    } else {
        if (validateUnit(char)) {
            if (char === ' ') {
                console.log('changing state from "unit" to "name"');
                actionHandler.incrementState();
            } else {
                console.log(`adding char ${char}`);
                actionHandler.unit.append(char);
            }
        } else {
            console.log(`invalid char given: "${char}"`);
        }
    }
}

function handleNameChange(char: NewChar, actionHandler: InternalEditableActionHandler) {
    console.log(`name char: ${char}`);
    if (typeof char === 'number') {
        console.log(`truncating by ${char} characters`);
        actionHandler.truncate(char);
    } else {
        if (validateName(char)) {
            actionHandler.name.append(char);
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
    start?: number;
    end?: number;
    num?: number;
    finished?: Ingredient[];
}
export type InputState = 'amount' | 'unit' | 'name';
export interface Ingredient {
    amount: string | null;
    unit: string | null;
    name: string | null;
    isEdited: boolean;
    state: InputState;
    show: boolean;
    key: string;
}

function getEmptyIngredient(): Ingredient {
    return {
        amount: null,
        unit: null,
        name: null,
        isEdited: false,
        state: 'amount',
        show: false,
        key: crypto.randomUUID(),
    };
}

function setEditableIngredientProperty(
    state: EditableIngredientState,
    action: Action,
    property: InputState
): EditableIngredientState {
    return produce(state, (draft) => {
        if (typeof action.value === 'undefined') {
            throw new Error('Cannot append an item with undefined value.');
        }
        draft.editable[property] = action.value;
    });
}

function appendIngredientProperty(
    state: EditableIngredientState,
    action: Action,
    property: InputState
): EditableIngredientState {
    return produce(state, (draft) => {
        if (typeof action.value === 'undefined') {
            throw new Error(`Cannot append editable ${property} with undefined value.`);
        }
        if (draft.editable[property] === null) {
            draft.editable[property] = action.value;
        } else {
            draft.editable[property] += action.value;
        }
    });
}

function sliceIngredientProperty(
    state: EditableIngredientState,
    action: Action,
    property: InputState
): EditableIngredientState {
    return produce(state, (draft) => {
        if (typeof action.start === 'undefined') {
            action.start = 0;
        }
        if (typeof action.end === 'undefined') {
            throw new Error('end value is required to slice item');
        }
        const prop = draft.editable[property];
        if (prop !== null) {
            draft.editable[property] = prop.slice(action.start, action.end);
        }
    });
}

function getPrevState(state: InputState): InputState {
    const nextState = { amount: 'amount', unit: 'amount', name: 'unit' };
    return nextState[state] as InputState;
}

function removeFromProperty(
    num: number,
    item: Ingredient,
    currentState: InputState
): [number, Ingredient] {
    if (num <= 0 || item.state !== currentState) {
        return [num, item];
    }
    const val = item[currentState];
    // Current state is empty, decrement state and return item
    if (val === null) {
        console.log('current state is null, decrementing', num);
        item.state = getPrevState(currentState);
        num--;
        return [num, item];
    }
    // number to delete is greater than current state, reset val and decrement state
    if (num > val.length) {
        item[currentState] = null;
        item.state = getPrevState(currentState);
        return [num - val.length - 1, item];
    }
    // number is equal, just reset val
    if (num === val.length) {
        item[currentState] = null;
        return [num - val.length, item];
    }
    // number to delete is within current state value
    item[currentState] = val.slice(0, val.length - num);
    return [0, item];
}

function truncateIngredient(num: number, item: Ingredient): Ingredient {
    let newItem = { ...item };

    [num, newItem] = removeFromProperty(num, newItem, 'name');
    [num, newItem] = removeFromProperty(num, newItem, 'unit');
    [num, newItem] = removeFromProperty(num, newItem, 'amount');
    return newItem;
}

export function getIngredientStr(item: Ingredient): string {
    if (item.amount === null && item.isEdited) {
        return '';
    }
    const amountStr = `${item.amount !== null ? item.amount : DEFAULT_INGREDIENT_STR}`;
    const unitStr = `${item.state !== 'amount' ? ' ' : ''}${item.unit !== null ? item.unit : ''}`;
    const nameStr = `${item.state === 'name' ? ' ' : ''}${item.name !== null ? item.name : ''}`;
    return `${amountStr}${unitStr}${nameStr}`;
}
type ShowStates = 'on' | 'off' | 'toggle';

interface EditableIngredientState {
    finished: Ingredient[];
    editable: Ingredient;
}

function itemsReducer(state: EditableIngredientState, action: Action): EditableIngredientState {
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
        case 'set_editable_amount': {
            return setEditableIngredientProperty(state, action, 'amount');
        }
        case 'set_editable_unit': {
            return setEditableIngredientProperty(state, action, 'unit');
        }
        case 'set_editable_name': {
            return setEditableIngredientProperty(state, action, 'name');
        }
        case 'set_finished': {
            return produce(state, (draft) => {
                if (typeof action.finished === 'undefined') {
                    throw new Error('finished array cannot be undefined');
                }
                draft.finished = action.finished;
            });
        }
        case 'append_editable_amount': {
            return appendIngredientProperty(state, action, 'amount');
        }
        case 'append_editable_unit': {
            return appendIngredientProperty(state, action, 'unit');
        }
        case 'append_editable_name': {
            return appendIngredientProperty(state, action, 'name');
        }
        case 'slice_editable_amount': {
            return sliceIngredientProperty(state, action, 'amount');
        }
        case 'slice_editable_unit': {
            return sliceIngredientProperty(state, action, 'unit');
        }
        case 'slice_editable_name': {
            return sliceIngredientProperty(state, action, 'name');
        }
        case 'toggle_editable_is_edited': {
            return produce(state, (draft) => {
                draft.editable.isEdited = !draft.editable.isEdited;
            });
        }
        case 'increment_editable_state': {
            return produce(state, (draft) => {
                const nextState = { amount: 'unit', unit: 'name', name: 'name' };
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
                draft.finished.push(draft.editable);
                draft.editable = getEmptyIngredient();
            });
        }
        default: {
            throw Error('Unknown action: ' + action.type);
        }
    }
}

interface ActionTypeHandler {
    set: (value: string) => void;
    append: (value: string) => void;
}
interface InternalEditableActionHandler {
    incrementState: () => void;
    submit: () => void;
    truncate: (num: number) => void;
    toggleEdited: () => void;
    amount: ActionTypeHandler;
    unit: ActionTypeHandler;
    name: ActionTypeHandler;
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
    currentStateValue: (value: string) => void;
    show: SetShow;
}
export interface EditableActionHandler {
    get: Get;
    set: Set;
    handleSubmit: (value: string) => void;
    handleChange: (value: string) => void;
}
interface UseIngredientListReturnType {
    state: EditableIngredientState;
    editableActionHandler: EditableActionHandler;
    setFinished: (finished: Ingredient[]) => void;
    removeFinished: (index: number) => void;
}
export function useEditableIngredients(): UseIngredientListReturnType {
    const [state, dispatch] = useReducer(itemsReducer, {
        finished: [],
        editable: getEmptyIngredient(),
    });

    const getEditableActionHandler = (): EditableActionHandler => {
        const editableActions: InternalEditableActionHandler = {
            reset: () => dispatch({ type: 'reset_editable' }),
            submit: () => dispatch({ type: 'submit_editable' }),
            truncate: (num: number) => dispatch({ type: 'truncate_editable', num }),
            toggleEdited: () => dispatch({ type: 'toggle_editable_is_edited' }),
            incrementState: () => dispatch({ type: 'increment_editable_state' }),
            amount: {
                set: (value: string) => dispatch({ type: 'set_editable_amount', value }),
                append: (value: string) => dispatch({ type: 'append_editable_amount', value }),
            },
            unit: {
                set: (value: string) => dispatch({ type: 'set_editable_unit', value }),
                append: (value: string) => dispatch({ type: 'append_editable_unit', value }),
            },
            name: {
                set: (value: string) => dispatch({ type: 'set_editable_name', value }),
                append: (value: string) => dispatch({ type: 'append_editable_name', value }),
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
            currentStateValue: () => state.editable[state.editable.state],
        };
        const handleSubmit = (value: string) => {
            if (state.editable.name === null) {
                console.log('ingredient not finished, resetting.');
                editableActions.reset();
            } else {
                console.log('submitted value:', value, state.editable);
                editableActions.setShow.off();
                editableActions.submit();
            }
        };
        const set: Set = {
            currentStateValue: (value: string) => {
                editableActions[state.editable.state].set(value);
                editableActions.incrementState();
            },
            show: editableActions.setShow,
        };
        const handleChange = (value: string) => {
            const diff = getTextDiff(value, state.editable, get.string());
            switch (state.editable.state) {
                case 'amount': {
                    return handleAmountChange(diff, state.editable, editableActions);
                }
                case 'unit': {
                    return handleUnitChange(diff, editableActions);
                }
                case 'name': {
                    return handleNameChange(diff, editableActions);
                }
            }
        };

        return { get, set, handleSubmit, handleChange };
    };
    const editableActionHandler = getEditableActionHandler();
    const setFinished = (finished: Ingredient[]) => {
        return dispatch({ type: 'set_finished', finished });
    };
    const removeFinished = (index: number) => {
        return dispatch({ type: 'remove_finished_item', index });
    };

    return { state, editableActionHandler, setFinished, removeFinished };
}
