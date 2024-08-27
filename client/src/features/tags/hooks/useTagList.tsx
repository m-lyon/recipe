import { produce } from 'immer';
import { useReducer } from 'react';

import { useWarningToast } from '@recipe/common/hooks';

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
interface RemoveFinishedTagAction {
    type: 'remove_finished_tag';
    index: number;
}
interface ResetEditableAction {
    type: 'reset_editable';
}
interface SetEditableShowAction {
    type: 'set_editable_show';
    value: ShowStates;
}
interface SetEditableValueAction {
    type: 'set_editable_value';
    value: string;
    _id?: string;
}
interface SetEditableValueAndSubmitAction {
    type: 'set_editable_value_and_submit';
    value: string;
    _id: string;
    isNew?: boolean;
}
interface SetFinishedTagsAction {
    type: 'set_finished_tags';
    tags: FinishedTag[];
}
interface SubmitEditableAction {
    type: 'submit_editable';
}
type Action =
    | RemoveFinishedTagAction
    | ResetEditableAction
    | SetEditableShowAction
    | SetEditableValueAction
    | SetEditableValueAndSubmitAction
    | SetFinishedTagsAction
    | SubmitEditableAction;
function reducer(state: TagState, action: Action) {
    switch (action.type) {
        case 'remove_finished_tag': {
            return produce(state, (draft) => {
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
                const newState = { on: true, off: false, toggle: !draft.editable.show };
                draft.editable.show = newState[action.value];
            });
        }
        case 'set_editable_value': {
            return produce(state, (draft) => {
                if (action.value === '') {
                    draft.editable.value = null;
                } else {
                    draft.editable.value = action.value.toLowerCase();
                }
                draft.editable._id = action._id;
            });
        }
        case 'set_editable_value_and_submit': {
            return produce(state, (draft) => {
                if (action.value === '') {
                    draft.editable = { value: null, show: false };
                } else {
                    draft.editable.value = action.value.toLowerCase();
                    draft.editable._id = action._id;
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
                draft.finished = action.tags;
            });
        }
        case 'submit_editable': {
            return produce(state, (draft) => {
                draft.finished.push({
                    _id: draft.editable._id!,
                    value: draft.editable.value!,
                    key: crypto.randomUUID(),
                    isNew: false,
                });
                draft.editable = { value: null, show: false };
            });
        }
        default:
            throw Error('Unknown action');
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
    const toast = useWarningToast();
    const removeTag = (index: number) => dispatch({ type: 'remove_finished_tag', index });
    const setTags = (tags: FinishedTag[]) => dispatch({ type: 'set_finished_tags', tags });
    const actions = {
        reset: () => dispatch({ type: 'reset_editable' }),
        setShow: (value: ShowStates) => dispatch({ type: 'set_editable_show', value }),
        setValue: (value: string, _id?: string) => {
            if (FORBIDDEN_TAGS.includes(value.toLowerCase())) {
                return toast({
                    title: 'Forbidden tag',
                    description: `${value} tag is automatically determined from ingredients.`,
                    position: 'top',
                });
            }
            dispatch({ type: 'set_editable_value', value, _id });
        },
        submit: () => {
            if (state.editable.value === null || state.editable.value === '') {
                dispatch({ type: 'reset_editable' });
            } else {
                if (state.editable.value === null) {
                    throw new Error('Editable value must not be null when submitting');
                }
                if (!state.editable._id) {
                    throw new Error('Tag ID is required for submission.');
                }
                dispatch({ type: 'submit_editable' });
            }
        },
        setAndSubmit: (value: string, _id: string, isNew?: boolean) => {
            if (FORBIDDEN_TAGS.includes(value.toLowerCase())) {
                return toast({
                    title: 'Forbidden tag',
                    description: `${value} tag is automatically determined from ingredients.`,
                    position: 'top',
                });
            }
            dispatch({ type: 'set_editable_value_and_submit', value, _id, isNew });
        },
    };
    const tagStr = state.editable.value === null ? '' : state.editable.value;

    return { state, removeTag, setTags, actions, tagStr };
}
