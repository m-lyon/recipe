import { useReducer } from 'react';

interface AddItemAction {
    type: 'add_item';
    value: string;
}
interface RemoveItemAction {
    type: 'remove_item';
    index: number;
}
interface SetValueAction {
    type: 'set_value';
    index: number;
    value: string;
}
interface SetItemsAction {
    type: 'set_items';
    items: string[];
}
type Action = AddItemAction | RemoveItemAction | SetValueAction | SetItemsAction;
interface EditableItem {
    value: string;
    key: string;
}

function itemsReducer(state: EditableItem[], action: Action): EditableItem[] {
    switch (action.type) {
        case 'add_item': {
            return [...state, { value: action.value, key: crypto.randomUUID() }];
        }
        case 'remove_item': {
            return state.filter((_, idx) => action.index !== idx);
        }
        case 'set_value': {
            return state.map((item, idx) => {
                if (action.index === idx) {
                    return { ...item, value: action.value };
                } else {
                    return item;
                }
            });
        }
        case 'set_items': {
            return action.items.map((item) => {
                return { value: item, key: crypto.randomUUID() };
            });
        }
        default: {
            throw Error('Unknown action');
        }
    }
}
interface ActionHandler {
    addItem: () => void;
    removeItem: (index: number) => void;
    setValue: (index: number, value: string) => void;
    setItems: (items: string[]) => void;
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
        setItems: (items: string[]) => dispatch({ type: 'set_items', items }),
    };

    return { items, actionHandler };
}
