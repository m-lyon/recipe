import { useReducer } from 'react';

interface Action {
    type: string;
    index?: number;
    value?: string;
}
interface EditableItem {
    value: string;
    isEdited: boolean;
}

function itemsReducer(state: EditableItem[], action: Action): EditableItem[] {
    switch (action.type) {
        case 'add_item': {
            if (typeof action.value === 'undefined') {
                throw new Error('Cannot add an item with undefined value.');
            }
            return [...state, { value: action.value, isEdited: false }];
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
                    return { value: action.value, isEdited: item.isEdited };
                } else {
                    return item;
                }
            });
        }
        case 'toggle_edited': {
            return state.map((item, idx) => {
                if (action.index === idx) {
                    return { value: item.value, isEdited: !item.isEdited };
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

export function useEditableItemList(defaultStr: string) {
    const [items, dispatch] = useReducer(itemsReducer, [{ value: defaultStr, isEdited: false }]);

    function handleAddItem() {
        dispatch({ type: 'add_item', value: defaultStr });
    }

    function handleRemoveItem(index: number) {
        dispatch({ type: 'remove_item', index });
    }

    function handleSetValue(index: number, value: string) {
        dispatch({ type: 'set_value', index, value });
    }

    function handleToggleEdited(index: number) {
        dispatch({ type: 'toggle_edited', index });
    }

    return { items, handleAddItem, handleRemoveItem, handleSetValue, handleToggleEdited };
}
