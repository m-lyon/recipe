import { useReducer } from 'react';

interface Action {
    type: string;
    index?: number;
    value?: string;
    start?: number;
    end?: number;
}
export interface Ingredient {
    amount: string | null;
    unit: string | null;
    ingredient: string | null;
    isEdited: boolean;
}
export type Property = 'amount' | 'unit' | 'ingredient';

function setItemProperty(state: Ingredient[], action: Action, property: Property): Ingredient[] {
    return state.map((item: Ingredient, idx: number): Ingredient => {
        if (action.index === idx) {
            return { ...item, [property]: action.value };
        } else {
            return item;
        }
    });
}

function appendItemProperty(state: Ingredient[], action: Action, property: Property): Ingredient[] {
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

function sliceItemProperty(state: Ingredient[], action: Action, property: Property): Ingredient[] {
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

function itemsReducer(state: Ingredient[], action: Action): Ingredient[] {
    switch (action.type) {
        case 'add_empty': {
            return [...state, { amount: null, unit: null, ingredient: null, isEdited: false }];
        }
        case 'remove_item': {
            return state.filter((_, idx: number): boolean => action.index !== idx);
        }
        case 'reset_item': {
            console.log('reset item called');
            return state.map((item: Ingredient, idx: number): Ingredient => {
                if (action.index === idx) {
                    return { amount: null, unit: null, ingredient: null, isEdited: false };
                } else {
                    return item;
                }
            });
        }
        case 'set_amount': {
            return setItemProperty(state, action, 'amount');
        }
        case 'set_unit': {
            return setItemProperty(state, action, 'unit');
        }
        case 'set_ingr': {
            return setItemProperty(state, action, 'ingredient');
        }
        case 'append_amount': {
            return appendItemProperty(state, action, 'amount');
        }
        case 'append_unit': {
            return appendItemProperty(state, action, 'unit');
        }
        case 'append_ingr': {
            return appendItemProperty(state, action, 'ingredient');
        }
        case 'slice_amount': {
            return sliceItemProperty(state, action, 'amount');
        }
        case 'slice_unit': {
            return sliceItemProperty(state, action, 'unit');
        }
        case 'slice_ingredient': {
            return sliceItemProperty(state, action, 'ingredient');
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
    remove: () => void;
    toggleEdited: () => void;
    amount: ActionTypeHandler;
    unit: ActionTypeHandler;
    ingredient: ActionTypeHandler;
    reset: () => void;
}
interface UseIngredientListReturnType {
    items: Ingredient[];
    getActionHandler: (index: number) => ActionHandler;
}
export function useIngredientList(defaultStr: string): UseIngredientListReturnType {
    const [items, dispatch] = useReducer(itemsReducer, [
        { amount: null, unit: null, ingredient: null, isEdited: false },
    ]);

    function getActionHandler(index: number) {
        const addEmpty = () => dispatch({ type: 'add_empty', value: defaultStr });
        const remove = () => dispatch({ type: 'remove_item', index });
        const reset = () => dispatch({ type: 'reset_item', index });
        const toggleEdited = () => dispatch({ type: 'toggle_edited', index });
        const addAmount = (value: string) => dispatch({ type: 'set_amount', index, value });
        const addUnit = (value: string) => dispatch({ type: 'set_unit', index, value });
        const addIngredient = (value: string) => dispatch({ type: 'set_ingr', index, value });
        const appendAmount = (value: string) => dispatch({ type: 'append_amount', index, value });
        const appendUnit = (value: string) => dispatch({ type: 'append_unit', index, value });
        const appendIngredient = (value: string) => dispatch({ type: 'append_ingr', index, value });

        return {
            addEmpty,
            remove,
            reset,
            toggleEdited,
            amount: { set: addAmount, append: appendAmount },
            unit: { set: addUnit, append: appendUnit },
            ingredient: { set: addIngredient, append: appendIngredient },
        };
    }

    return { items, getActionHandler };
}
