import { produce } from 'immer';
import { useReducer } from 'react';

interface Action {
    type: string;
    value?: string;
}
interface State {
    pluralTitle?: string;
    isIngredient: boolean;
}
function reducer(state: State, action: Action) {
    switch (action.type) {
        case 'set_plural_title': {
            return produce(state, (draft) => {
                draft.pluralTitle = action.value;
            });
        }
        case 'toggle_is_ingredient': {
            return produce(state, (draft) => {
                draft.isIngredient = !state.isIngredient;
            });
        }
        default: {
            throw Error('Unknown action: ' + action.type);
        }
    }
}

interface ActionHandler {
    setPluralTitle: (value: string) => void;
    toggleIsIngredient: () => void;
}
export interface UseAsIngredientReturnType {
    state: State;
    actionHandler: ActionHandler;
}
export function useAsIngredient(): UseAsIngredientReturnType {
    const [state, dispatch] = useReducer(reducer, { isIngredient: false });
    const actionHandler = {
        setPluralTitle: (value: string) => dispatch({ type: 'set_plural_title', value }),
        toggleIsIngredient: () => dispatch({ type: 'toggle_is_ingredient' }),
    };

    return { state, actionHandler };
}
