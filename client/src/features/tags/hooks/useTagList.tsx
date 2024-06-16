import { produce } from 'immer';
import { useReducer } from 'react';

export const DEFAULT_TAG_STR = 'Add a tag...';
const FORBIDDEN_TAGS = ['vegan', 'vegetarian'];
export interface FinishedTag {
    _id: string;
    value: string;
    key: string;
    isNew: boolean;
}
export interface EditableTag {
    value: string | null;
    show: boolean;
    _id?: string;
}
interface TagState {
    finished: FinishedTag[];
    editable: EditableTag;
}
type ShowStates = 'on' | 'off' | 'toggle';
interface Action {
    type: string;
    index?: number;
    value?: string;
    tags?: FinishedTag[];
    _id?: string;
    isNew?: boolean;
}
function reducer(state: TagState, action: Action) {
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
                draft.editable = { value: null, show: false };
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
                if (action.value === '') {
                    draft.editable.value = null;
                } else {
                    if (FORBIDDEN_TAGS.includes(action.value.toLowerCase())) {
                        throw new Error('Forbidden tag.');
                    }
                    draft.editable.value = action.value.toLowerCase();
                }
                draft.editable._id = action._id;
            });
        }
        case 'set_editable_value_and_submit': {
            return produce(state, (draft) => {
                if (typeof action.value === 'undefined') {
                    throw new Error('value is required to set editable value');
                }
                if (action.value === '') {
                    draft.editable = { value: null, show: false };
                } else {
                    if (FORBIDDEN_TAGS.includes(action.value.toLowerCase())) {
                        throw new Error('Forbidden tag.');
                    }
                    draft.editable.value = action.value.toLowerCase();
                    draft.editable._id = action._id;
                    if (!draft.editable._id) {
                        throw new Error('Tag ID is required for submission.');
                    }
                    draft.finished.push({
                        _id: draft.editable._id,
                        value: draft.editable.value,
                        key: crypto.randomUUID(),
                        isNew: action.isNew ? true : false,
                    });
                    draft.editable = { value: null, show: false };
                }
            });
        }
        case 'set_finished_tags': {
            return produce(state, (draft) => {
                if (action.tags === undefined) {
                    throw new Error('tags is required to set finished tags');
                }
                draft.finished = action.tags;
            });
        }
        case 'submit_editable': {
            return produce(state, (draft) => {
                if (draft.editable.value === null) {
                    throw new Error('Editable value must not be null when submitting');
                }
                if (!draft.editable._id) {
                    throw new Error('Tag ID is required for submission.');
                }
                draft.finished.push({
                    _id: draft.editable._id,
                    value: draft.editable.value,
                    key: crypto.randomUUID(),
                    isNew: false,
                });
                draft.editable = { value: null, show: false };
            });
        }
        default:
            throw Error('Unknown action: ' + action.type);
    }
}
export type SetAndSubmit = (value: string, _id: string, isNew?: boolean) => void;
export interface EditableTagActionHandler {
    reset: () => void;
    setShow: (value: ShowStates) => void;
    setValue: (value: string, _id?: string) => void;
    submit: () => void;
    setAndSubmit: SetAndSubmit;
}
export interface UseTagListReturnType {
    state: TagState;
    removeTag: (index: number) => void;
    setTags: (tags: FinishedTag[]) => void;
    actions: EditableTagActionHandler;
    tagStr: string;
}
export function useTagList(): UseTagListReturnType {
    const [state, dispatch] = useReducer(reducer, {
        finished: [],
        editable: { value: null, show: false },
    });

    const removeTag = (index: number) => dispatch({ type: 'remove_finished_tag', index });
    const setTags = (tags: FinishedTag[]) => dispatch({ type: 'set_finished_tags', tags });
    const actions = {
        reset: () => dispatch({ type: 'reset_editable' }),
        setShow: (value: ShowStates) => dispatch({ type: 'set_editable_show', value }),
        setValue: (value: string, _id?: string) => {
            dispatch({ type: 'set_editable_value', value, _id });
        },
        submit: () => {
            if (state.editable.value === null || state.editable.value === '') {
                dispatch({ type: 'reset_editable' });
            } else {
                dispatch({ type: 'submit_editable' });
            }
        },
        setAndSubmit: (value: string, _id: string, isNew?: boolean) => {
            dispatch({ type: 'set_editable_value_and_submit', value, _id, isNew });
        },
    };
    const tagStr = state.editable.value === null ? '' : state.editable.value;

    return { state, removeTag, setTags, actions, tagStr };
}
