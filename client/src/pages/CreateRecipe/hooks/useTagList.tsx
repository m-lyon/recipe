import { useReducer } from 'react';
import { produce } from 'immer';

export const DEFAULT_TAG_STR = 'Add a tag...';

interface FinishedTag {
    _id?: string;
    value: string;
    key: string;
}
export interface EditableTag {
    value: string | null;
    isEdited: boolean;
    show: boolean;
    _id?: string;
}
interface TagState {
    finished: FinishedTag[];
    editable: EditableTag;
}
type ShowStates = 'on' | 'off' | 'toggle';

function reducer(state: TagState, action: any) {
    switch (action.type) {
        case 'remove_finished_tag': {
            return produce(state, (draft) => {
                if (typeof action.index === 'undefined') {
                    throw new Error('index is required to remove finished ingredient.');
                }
                draft.finished.splice(action.index, 1);
            });
        }
        case 'reset_editable': {
            return produce(state, (draft) => {
                draft.editable = { value: null, isEdited: false, show: false };
            });
        }
        case 'set_editable_show': {
            return produce(state, (draft) => {
                if (typeof action.value === 'undefined') {
                    throw new Error('value is required to set editable show state');
                }
                if (!['on', 'off', 'toggle'].includes(action.value)) {
                    throw new Error('invalid show value given');
                }
                const newState = { on: true, off: false, toggle: !draft.editable.show };
                draft.editable.show = newState[action.value as ShowStates];
            });
        }
        case 'set_editable_value': {
            return produce(state, (draft) => {
                if (typeof action.value === 'undefined') {
                    throw new Error('value is required to set editable value');
                }
                if (!draft.editable.isEdited) {
                    draft.editable.isEdited = true;
                }
                draft.editable.value = action.value;
                draft.editable._id = action._id;
            });
        }
        case 'set_editable_value_and_submit': {
            return produce(state, (draft) => {
                if (typeof action.value === 'undefined') {
                    throw new Error('value is required to set editable value');
                }
                if (!draft.editable.isEdited) {
                    draft.editable.isEdited = true;
                }
                draft.editable.value = action.value;
                draft.editable._id = action._id;
                if (draft.editable.value === null || draft.editable.value === '') {
                    console.log('resetting editable because value is', draft.editable.value);
                    draft.editable = { value: null, isEdited: false, show: false };
                } else {
                    console.log('submitting editable');
                    draft.finished.push({
                        _id: draft.editable._id,
                        value: draft.editable.value,
                        key: crypto.randomUUID(),
                    });
                    draft.editable = { value: null, isEdited: false, show: false };
                }
            });
        }
        case 'toggle_editable_is_edited': {
            return produce(state, (draft) => {
                draft.editable.isEdited = !draft.editable.isEdited;
            });
        }
        case 'submit_editable': {
            return produce(state, (draft) => {
                if (draft.editable.value === null) {
                    throw new Error('editable value must not be null when submitting');
                }
                draft.finished.push({
                    _id: draft.editable._id,
                    value: draft.editable.value,
                    key: crypto.randomUUID(),
                });
                draft.editable = { value: null, isEdited: false, show: false };
            });
        }
        default:
            throw Error('Unknown action: ' + action.type);
    }
}
export interface EditableTagActionHandler {
    reset: () => void;
    setShow: (value: ShowStates) => void;
    setValue: (value: string, _id?: string) => void;
    toggleIsEdited: () => void;
    submit: () => void;
    setAndSubmit: (value: string, _id?: string) => void;
}
export interface UseTagListReturnType {
    state: TagState;
    removeTag: (index: number) => void;
    actions: EditableTagActionHandler;
    tagStr: string;
}
export function useTagList(): UseTagListReturnType {
    const [state, dispatch] = useReducer(reducer, {
        finished: [],
        editable: { value: null, isEdited: false, show: false },
    });

    const removeTag = (index: number) => dispatch({ type: 'remove_finished_tag', index });
    const actions = {
        reset: () => dispatch({ type: 'reset_editable' }),
        setShow: (value: ShowStates) => dispatch({ type: 'set_editable_show', value }),
        setValue: (value: string, _id?: string) => {
            dispatch({ type: 'set_editable_value', value, _id });
        },
        toggleIsEdited: () => dispatch({ type: 'toggle_editable_is_edited' }),
        submit: () => {
            if (state.editable.value === null || state.editable.value === '') {
                console.log('resetting editable because value is', state.editable.value);
                dispatch({ type: 'reset_editable' });
            } else {
                console.log('submitting editable');
                dispatch({ type: 'submit_editable' });
            }
        },
        setAndSubmit: (value: string, _id?: string) => {
            dispatch({ type: 'set_editable_value_and_submit', value, _id });
        },
    };
    const tagStr = state.editable.value === null ? DEFAULT_TAG_STR : state.editable.value;

    return { state, removeTag, actions, tagStr };
}
