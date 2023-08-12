import { useReducer } from 'react';
import { DEFAULT_INGREDIENT_STR } from '../components/utils';

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

function getNextState(state: InputState) {
    switch (state) {
        case 'amount': {
            return 'unit';
        }
        case 'unit': {
            return 'name';
        }
        case 'name': {
            throw new Error('Cannot increment past name');
        }
        default: {
            throw new Error('Unknown state given');
        }
    }
}

function getPrevState(state: InputState) {
    switch (state) {
        case 'amount': {
            throw new Error('Cannot decrement past amount');
        }
        case 'unit': {
            return 'amount';
        }
        case 'name': {
            return 'unit';
        }
        default: {
            throw new Error('Unknown state given');
        }
    }
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

    console.log('before', num);
    [num, newItem] = removeFromProperty(num, newItem, 'name');
    console.log('after_name', num);
    [num, newItem] = removeFromProperty(num, newItem, 'unit');
    console.log('after_unit', num);
    [num, newItem] = removeFromProperty(num, newItem, 'amount');
    console.log('after_amnt', num);
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

function itemsReducer(state: Ingredient[], action: Action): Ingredient[] {
    switch (action.type) {
        case 'add_empty': {
            return [
                ...state,
                { amount: null, unit: null, name: null, isEdited: false, state: 'amount' },
            ];
        }
        case 'remove_item': {
            return state.filter((_, idx: number): boolean => action.index !== idx);
        }
        case 'reset_item': {
            console.log('reset item called');
            return state.map((item: Ingredient, idx: number): Ingredient => {
                if (action.index === idx) {
                    return {
                        amount: null,
                        unit: null,
                        name: null,
                        isEdited: false,
                        state: 'amount',
                    };
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
export interface ActionHandler {
    addEmpty: () => void;
    getStr: () => string;
    incrementState: () => void;
    remove: () => void;
    truncate: (num: number) => void;
    toggleEdited: () => void;
    amount: ActionTypeHandler;
    unit: ActionTypeHandler;
    name: ActionTypeHandler;
    reset: () => void;
}
interface UseIngredientListReturnType {
    items: Ingredient[];
    getActionHandler: (index: number) => ActionHandler;
}
export function useIngredientList(): UseIngredientListReturnType {
    const [items, dispatch] = useReducer(itemsReducer, [
        { amount: null, unit: null, name: null, isEdited: false, state: 'amount' },
    ]);

    function getActionHandler(index: number) {
        const addEmpty = () => dispatch({ type: 'add_empty' });
        const remove = () => dispatch({ type: 'remove_item', index });
        const reset = () => dispatch({ type: 'reset_item', index });
        const truncate = (num: number) => dispatch({ type: 'truncate', index, num });
        const toggleEdited = () => dispatch({ type: 'toggle_edited', index });
        const addAmount = (value: string) => dispatch({ type: 'set_amount', index, value });
        const addUnit = (value: string) => dispatch({ type: 'set_unit', index, value });
        const addName = (value: string) => dispatch({ type: 'set_name', index, value });
        const appendAmount = (value: string) => dispatch({ type: 'append_amount', index, value });
        const appendUnit = (value: string) => dispatch({ type: 'append_unit', index, value });
        const appendName = (value: string) => dispatch({ type: 'append_name', index, value });
        const incrementState = () => dispatch({ type: 'increment_state', index });
        const getStr = () => getIngredientStr(items[index]);

        return {
            addEmpty,
            getStr,
            remove,
            reset,
            truncate,
            toggleEdited,
            incrementState,
            amount: { set: addAmount, append: appendAmount },
            unit: { set: addUnit, append: appendUnit },
            name: { set: addName, append: appendName },
        };
    }

    return { items, getActionHandler };
}
