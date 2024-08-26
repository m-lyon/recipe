import { useReducer } from 'react';
import { produce } from 'immer';

interface InstructionLine {
    value: string;
    key: string;
}
interface Subsection {
    name?: string;
    instructions: InstructionLine[];
}
type InstructionListState = Subsection[];
interface AddNewLineAction {
    subsection: number;
    type: 'add_line';
}
interface RemoveLineAction {
    subsection: number;
    index: number;
    type: 'remove_line';
}
interface SetLineAction {
    subsection: number;
    index: number;
    value: string;
    type: 'set_line';
}
interface SetSubsectionAction {
    subsection: number;
    lines: string[];
    name?: string;
    type: 'set_subsection';
}
interface AddSubsectionAction {
    type: 'add_subsection';
}
interface RemoveSubsectionAction {
    subsection: number;
    type: 'remove_subsection';
}
interface SetSubsectionNameAction {
    subsection: number;
    value: string;
    type: 'set_subsection_name';
}
type Action =
    | AddNewLineAction
    | RemoveLineAction
    | SetLineAction
    | SetSubsectionAction
    | AddSubsectionAction
    | RemoveSubsectionAction
    | SetSubsectionNameAction;
type GetSubsectionAction = Exclude<Action, AddSubsectionAction | RemoveSubsectionAction>;
function getActionSubsection(state: InstructionListState, action: GetSubsectionAction) {
    return getSubsection(state, action.subsection);
}
function getSubsection(state: InstructionListState, subsection: number) {
    if (state.length <= subsection) {
        throw new Error('Invalid subsection index');
    }
    return state[subsection];
}
function getEmptyLine() {
    return { value: '', key: crypto.randomUUID() };
}
function itemsReducer(state: InstructionListState, action: Action): InstructionListState {
    switch (action.type) {
        case 'add_line': {
            return produce(state, (draft) => {
                const subsection = getActionSubsection(draft, action);
                subsection.instructions.push(getEmptyLine());
            });
        }
        case 'remove_line': {
            return produce(state, (draft) => {
                const subsection = getActionSubsection(draft, action);
                subsection.instructions.splice(action.index, 1);
            });
        }
        case 'set_line': {
            return produce(state, (draft) => {
                const subsection = getActionSubsection(draft, action);
                subsection.instructions[action.index].value = action.value;
            });
        }
        case 'set_subsection': {
            return produce(state, (draft) => {
                const subsection = getActionSubsection(draft, action);
                if (action.name) {
                    subsection.name = action.name;
                }
                subsection.instructions = action.lines.map((item) => {
                    return { value: item, key: crypto.randomUUID() };
                });
            });
        }
        case 'add_subsection': {
            return produce(state, (draft) => {
                draft.push({ instructions: [getEmptyLine()] });
            });
        }
        case 'remove_subsection': {
            return produce(state, (draft) => {
                draft.splice(action.subsection, 1);
            });
        }
        case 'set_subsection_name': {
            return produce(state, (draft) => {
                draft[action.subsection].name = action.value;
            });
        }
        default: {
            throw Error('Unknown action type');
        }
    }
}
interface ActionHandler {
    addLine: (subsection: number) => void;
    removeLine: (subsection: number, index: number) => void;
    setLine: (subsection: number, index: number, value: string) => void;
    setSubsection: (subsection: number, items: string[], name?: string) => void;
    addSubsection: () => void;
    removeSubsection: (subsection: number) => void;
    setSubsectionName: (subsection: number, value: string) => void;
}
export interface UseInstructionListReturnType {
    state: InstructionListState;
    actionHandler: ActionHandler;
}
export function useInstructionList(): UseInstructionListReturnType {
    const [state, dispatch] = useReducer(itemsReducer, [{ instructions: [getEmptyLine()] }]);
    const actionHandler: ActionHandler = {
        addLine: (subsection) => dispatch({ type: 'add_line', subsection }),
        removeLine: (subsection, index) => dispatch({ type: 'remove_line', subsection, index }),
        setLine: (subsection, index, value) =>
            dispatch({ type: 'set_line', subsection, index, value }),
        setSubsection: (subsection, lines, name) =>
            dispatch({ type: 'set_subsection', subsection, lines, name }),
        addSubsection: () => dispatch({ type: 'add_subsection' }),
        removeSubsection: (subsection) => dispatch({ type: 'remove_subsection', subsection }),
        setSubsectionName: (subsection, value) =>
            dispatch({ type: 'set_subsection_name', subsection, value }),
    };

    return { state, actionHandler };
}
