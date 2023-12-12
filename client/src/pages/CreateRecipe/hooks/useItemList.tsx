import { useReducer } from 'react';

interface Action {
    type: string;
    index?: number;
    value?: string;
}
interface EditableItem {
    value: string;
    key: string;
}

function itemsReducer(state: EditableItem[], action: Action): EditableItem[] {
    switch (action.type) {
        case 'add_item': {
            if (typeof action.value === 'undefined') {
                throw new Error('Cannot add an item with undefined value.');
            }
            return [...state, { value: action.value, key: crypto.randomUUID() }];
        }
        case 'remove_item': {
            return state.filter((_, idx) => action.index !== idx);
        }
        case 'set_value': {
            return state.map((item, idx) => {
                if (typeof action.value === 'undefined') {
                    throw new Error('Cannot add an item with undefined value.');
                }
                if (action.index === idx) {
                    return { ...item, value: action.value };
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
interface ActionHandler {
    addItem: () => void;
    removeItem: (index: number) => void;
    setValue: (index: number, value: string) => void;
}
export interface UseItemListReturnType {
    items: EditableItem[];
    actionHandler: ActionHandler;
}
export function useItemList(): UseItemListReturnType {
    const [items, dispatch] = useReducer(itemsReducer, [{ value: '', key: crypto.randomUUID() }]);
    const actionHandler = {
        addItem: () => dispatch({ type: 'add_item', value: '' }),
        removeItem: (index: number) => dispatch({ type: 'remove_item', index }),
        setValue: (index: number, value: string) => dispatch({ type: 'set_value', index, value }),
    };

    return { items, actionHandler };
}
