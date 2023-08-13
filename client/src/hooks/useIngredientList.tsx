import { useReducer } from 'react';

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
function handleAmountChange(char: NewChar, item: Ingredient, actionHandler: InternalActionHandler) {
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

function handleUnitChange(char: NewChar, actionHandler: InternalActionHandler) {
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

function handleNameChange(char: NewChar, actionHandler: InternalActionHandler) {
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
}
export type InputState = 'amount' | 'unit' | 'name';
export interface Ingredient {
    amount: string | null;
    unit: string | null;
    name: string | null;
    isEdited: boolean;
    state: InputState;
    show: boolean;
}

function getEmptyIngredient(): Ingredient {
    return { amount: null, unit: null, name: null, isEdited: false, state: 'amount', show: false };
}

function setIngredientProperty(
    state: Ingredient[],
    action: Action,
    property: InputState
): Ingredient[] {
    return state.map((item: Ingredient, idx: number): Ingredient => {
        if (action.index === idx) {
            return { ...item, [property]: action.value };
        } else {
            return item;
        }
    });
}

function appendIngredientProperty(
    state: Ingredient[],
    action: Action,
    property: InputState
): Ingredient[] {
    return state.map((item: Ingredient, idx: number): Ingredient => {
        if (typeof action.value === 'undefined') {
            throw new Error('Cannot append an item with undefined value.');
        }
        if (action.index === idx) {
            const prop = item[property];
            if (prop === null) {
                return { ...item, [property]: action.value };
            } else {
                return { ...item, [property]: prop.concat(action.value) };
            }
        } else {
            return item;
        }
    });
}

function sliceIngredientProperty(
    state: Ingredient[],
    action: Action,
    property: InputState
): Ingredient[] {
    if (typeof action.start === 'undefined') {
        action.start = 0;
    }
    if (typeof action.end === 'undefined') {
        throw new Error('end value is required to slice item');
    }
    return state.map((item: Ingredient, idx: number): Ingredient => {
        if (typeof action.value === 'undefined') {
            throw new Error('Cannot append an item with undefined value.');
        }
        if (action.index === idx) {
            const prop = item[property];
            if (prop === null) {
                return { ...item, [property]: action.value };
            } else {
                return { ...item, [property]: action.value.slice(0, action.end) };
            }
        } else {
            return item;
        }
    });
}

function getNextState(state: InputState): InputState {
    const nextState = { amount: 'unit', unit: 'name', name: 'name' };
    return nextState[state] as InputState;
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

const getIngredientStr = (item: Ingredient): string => {
    if (item.amount === null && item.isEdited) {
        return '';
    }
    const amountStr = `${item.amount !== null ? item.amount : DEFAULT_INGREDIENT_STR}`;
    const unitStr = `${item.state !== 'amount' ? ' ' : ''}${item.unit !== null ? item.unit : ''}`;
    const nameStr = `${item.state === 'name' ? ' ' : ''}${item.name !== null ? item.name : ''}`;
    return `${amountStr}${unitStr}${nameStr}`;
};
type ShowStates = 'on' | 'off' | 'toggle';

function itemsReducer(state: Ingredient[], action: Action): Ingredient[] {
    switch (action.type) {
        case 'add_empty': {
            return [...state, getEmptyIngredient()];
        }
        case 'remove_item': {
            return state.filter((_, idx: number): boolean => action.index !== idx);
        }
        case 'reset_item': {
            console.log('reset item called');
            return state.map((item: Ingredient, idx: number): Ingredient => {
                if (action.index === idx) {
                    return getEmptyIngredient();
                } else {
                    return item;
                }
            });
        }
        case 'set_show': {
            return state.map((item: Ingredient, idx: number): Ingredient => {
                if (typeof action.value === 'undefined') {
                    throw new Error('num is required to truncate item');
                }
                if (!['on', 'off', 'toggle'].includes(action.value)) {
                    throw new Error('invalid show value given');
                }
                if (action.index === idx) {
                    const newState = { on: true, off: false, toggle: !item.show };
                    return { ...item, show: newState[action.value as ShowStates] };
                } else {
                    return item;
                }
            });
        }
        case 'set_amount': {
            return setIngredientProperty(state, action, 'amount');
        }
        case 'set_unit': {
            return setIngredientProperty(state, action, 'unit');
        }
        case 'set_name': {
            return setIngredientProperty(state, action, 'name');
        }
        case 'append_amount': {
            return appendIngredientProperty(state, action, 'amount');
        }
        case 'append_unit': {
            return appendIngredientProperty(state, action, 'unit');
        }
        case 'append_name': {
            return appendIngredientProperty(state, action, 'name');
        }
        case 'slice_amount': {
            return sliceIngredientProperty(state, action, 'amount');
        }
        case 'slice_unit': {
            return sliceIngredientProperty(state, action, 'unit');
        }
        case 'slice_name': {
            return sliceIngredientProperty(state, action, 'name');
        }
        case 'toggle_edited': {
            return state.map((item: Ingredient, idx: number): Ingredient => {
                if (action.index === idx) {
                    return { ...item, isEdited: !item.isEdited };
                } else {
                    return item;
                }
            });
        }
        case 'increment_state': {
            return state.map((item: Ingredient, idx: number): Ingredient => {
                if (action.index === idx) {
                    return { ...item, state: getNextState(item.state) };
                } else {
                    return item;
                }
            });
        }
        case 'truncate': {
            return state.map((item: Ingredient, idx: number): Ingredient => {
                if (action.index === idx) {
                    if (typeof action.num === 'undefined') {
                        throw new Error('num is required to truncate item');
                    }
                    const newItem = truncateIngredient(action.num, item);
                    console.log(newItem);
                    return newItem;
                } else {
                    return item;
                }
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
interface InternalActionHandler {
    addEmpty: () => void;
    incrementState: () => void;
    remove: () => void;
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
    currentValue: () => string | null;
}
interface SetShow {
    on: () => void;
    off: () => void;
    toggle: () => void;
}
interface Set {
    currentValue: (value: string) => void;
    show: SetShow;
}
export interface ActionHandler {
    get: Get;
    set: Set;
    handleSubmit: (value: string) => void;
    handleChange: (value: string) => void;
}
interface UseIngredientListReturnType {
    items: Ingredient[];
    getActionHandler: (index: number) => ActionHandler;
}
export function useIngredientList(): UseIngredientListReturnType {
    const [items, dispatch] = useReducer(itemsReducer, [getEmptyIngredient()]);

    function getActionHandler(index: number): ActionHandler {
        const item: Ingredient = items[index];
        const actions: InternalActionHandler = {
            addEmpty: () => dispatch({ type: 'add_empty' }),
            remove: () => dispatch({ type: 'remove_item', index }),
            reset: () => dispatch({ type: 'reset_item', index }),
            truncate: (num: number) => dispatch({ type: 'truncate', index, num }),
            toggleEdited: () => dispatch({ type: 'toggle_edited', index }),
            incrementState: () => dispatch({ type: 'increment_state', index }),
            amount: {
                set: (value: string) => dispatch({ type: 'set_amount', index, value }),
                append: (value: string) => dispatch({ type: 'append_amount', index, value }),
            },
            unit: {
                set: (value: string) => dispatch({ type: 'set_unit', index, value }),
                append: (value: string) => dispatch({ type: 'append_unit', index, value }),
            },
            name: {
                set: (value: string) => dispatch({ type: 'set_name', index, value }),
                append: (value: string) => dispatch({ type: 'append_name', index, value }),
            },
            setShow: {
                on: () => dispatch({ type: 'set_show', index, value: 'on' }),
                off: () => dispatch({ type: 'set_show', index, value: 'off' }),
                toggle: () => dispatch({ type: 'set_show', index, value: 'toggle' }),
            },
        };

        // Public functions
        const get: Get = {
            string: () => getIngredientStr(item),
            currentValue: () => item[item.state],
        };
        const handleSubmit = (value: string) => {
            if (item.name === null) {
                console.log('ingredient not finished, resetting.');
                actions.reset();
            } else {
                console.log('submitted value:', value, item);
                actions.setShow.off();
                actions.addEmpty();
            }
        };
        const set: Set = {
            currentValue: (value: string) => {
                actions[item.state].set(value);
                actions.incrementState();
            },
            show: actions.setShow,
        };
        const handleChange = (value: string) => {
            const diff = getTextDiff(value, item, getIngredientStr(item));
            switch (item.state) {
                case 'amount': {
                    return handleAmountChange(diff, item, actions);
                }
                case 'unit': {
                    return handleUnitChange(diff, actions);
                }
                case 'name': {
                    return handleNameChange(diff, actions);
                }
            }
        };

        return { get, set, handleSubmit, handleChange };
    }

    return { items, getActionHandler };
}
