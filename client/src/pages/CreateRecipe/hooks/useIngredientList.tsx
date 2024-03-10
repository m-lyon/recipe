import { produce } from 'immer';
import { useReducer } from 'react';
import { useQuery } from '@apollo/client';
import { useToast } from '@chakra-ui/react';

import { gql } from '../../../__generated__/';
import { isPlural } from '../../../utils/plural';
import { isFraction, formatFraction, VALID_NUMBER_REGEX } from '../../../utils/number';
import { GetIngredientsQuery, GetPrepMethodsQuery } from '../../../__generated__/graphql';
import { GetUnitsQuery, EnumRecipeIngredientType } from '../../../__generated__/graphql';

export const DEFAULT_INGREDIENT_STR = 'Enter ingredient';
export const GET_UNITS = gql(`
    query GetUnits {
        unitMany(limit: 5000) {
            _id
            shortSingular
            shortPlural
            longSingular
            longPlural
            preferredNumberFormat
        }
    }
`);
export const GET_INGREDIENTS = gql(`
    query GetIngredients {
        ingredientMany(limit: 5000) {
            _id
            name
            pluralName
            isCountable
        }
        recipeMany(limit: 5000, filter: {isIngredient: true}) {
            _id
            title
            pluralTitle
        }
    }
`);
export const GET_PREP_METHODS = gql(`
    query GetPrepMethods {
        prepMethodMany(limit: 5000) {
            _id
            value
        }
    }
`);

type NewChar = string | number;
function handleQuantityChange(
    char: NewChar,
    item: EditableIngredient,
    actionHandler: InternalActionHandler
) {
    if (typeof char === 'number') {
        actionHandler.truncate(char);
    } else {
        // Validate quantity upon completion
        if (char === ' ' && item.quantity !== null) {
            if (!VALID_NUMBER_REGEX.test(item.quantity)) {
                throw new Error('Invalid quantity.');
            } else {
                actionHandler.incrementState();
                actionHandler.setShow.on();
            }
            // Skip quantity with alphabetical characters
        } else if (item.quantity === null && /^[a-zA-Z]$/.test(char)) {
            actionHandler.incrementState();
            actionHandler.setShow.on();
            handleIngredientNameChange(char, actionHandler);
            // Starting input should be a number
        } else if (item.quantity === null && /^[\d]$/.test(char)) {
            actionHandler.quantity.append(char);
            if (item.show) {
                actionHandler.setShow.off();
            }
            // Valid numerical input
        } else if (/^[\d\/\.-]$/.test(char)) {
            actionHandler.quantity.append(char);
            if (item.show) {
                actionHandler.setShow.off();
            }
            // Throw error for invalid input
        } else {
            throw new Error('Only numbers and fractions are allowed when inputting a quantity.');
        }
    }
}

function handleUnitChange(
    char: NewChar,
    item: EditableIngredient,
    unitData: GetUnitsQuery | undefined,
    actionHandler: InternalActionHandler
) {
    if (typeof char === 'number') {
        actionHandler.truncate(char);
    } else {
        if (/^[a-zA-Z ]$/.test(char)) {
            if (char === ' ' && item.unit.value !== null) {
                if (!unitData) {
                    throw new Error('Could not load units');
                }
                const unitValue = item.unit.value;
                for (const unit of unitData.unitMany) {
                    if (isPlural(item.quantity)) {
                        if (unit.longPlural === unitValue || unit.shortPlural === unitValue) {
                            actionHandler.unit.set(unit.shortPlural, unit._id);
                            return actionHandler.incrementState();
                        }
                    } else {
                        if (unit.longSingular === unitValue || unit.shortSingular === unitValue) {
                            actionHandler.unit.set(unit.shortSingular, unit._id);
                            return actionHandler.incrementState();
                        }
                    }
                }
            } else {
                actionHandler.unit.append(char);
            }
        } else {
            throw new Error('Only letters and spaces are allowed when inputting unit.');
        }
    }
}

function handleIngredientNameChange(char: NewChar, actionHandler: InternalActionHandler) {
    if (typeof char === 'number') {
        actionHandler.truncate(char);
    } else {
        if (/^[a-zA-Z \-]$/.test(char)) {
            actionHandler.name.append(char);
        } else {
            throw new Error(
                'Only letters and spaces are allowed when inputting an ingredient name.'
            );
        }
    }
}

function handlePrepMethodChange(char: NewChar, actionHandler: InternalActionHandler) {
    if (typeof char === 'number') {
        actionHandler.truncate(char);
    } else {
        if (/^[a-zA-Z ]$/.test(char)) {
            actionHandler.prepMethod.append(char);
        } else {
            throw new Error(`Only letters and spaces are allowed when inputting a prep method.`);
        }
    }
}

export function getTextDiff(value: string, origStr: string): NewChar {
    if (value.length > origStr.length) {
        return value.replace(origStr, '');
    }
    if (value.length < origStr.length) {
        return origStr.length - value.length;
    }
    console.log('this shouldnt happen');
    return '';
}
interface Action {
    type: string;
    index?: number;
    value?: string;
    nullableValue?: string | null;
    _id?: string;
    start?: number;
    end?: number;
    num?: number;
    finished?: FinishedIngredient[];
    ingrType?: EnumRecipeIngredientType;
}
export type InputState = 'quantity' | 'unit' | 'name' | 'prepMethod';
export type DBInputState = Extract<InputState, 'unit' | 'name' | 'prepMethod'>;
export interface EditableFromDB {
    value: string | null;
    _id?: string;
}
export interface EditableIngredient {
    quantity: string | null;
    unit: EditableFromDB;
    name: EditableFromDB;
    prepMethod: EditableFromDB;
    state: InputState;
    show: boolean;
    key: string;
    type?: EnumRecipeIngredientType;
}
export interface FinishedName extends EditableFromDB {
    value: string;
    _id: string;
}
export interface FinishedIngredient {
    quantity: string | null;
    unit: EditableFromDB;
    name: FinishedName;
    prepMethod: EditableFromDB;
    key: string;
    type: EnumRecipeIngredientType;
}
type ShowStates = 'on' | 'off' | 'toggle';
interface IngredientState {
    finished: FinishedIngredient[];
    editable: EditableIngredient;
}
function getEmptyIngredient(): EditableIngredient {
    return {
        quantity: null,
        unit: { value: null },
        name: { value: null },
        prepMethod: { value: null },
        state: 'quantity',
        show: false,
        key: crypto.randomUUID(),
    };
}

function setQuantity(state: IngredientState, action: Action): IngredientState {
    return produce(state, (draft) => {
        if (typeof action.nullableValue === 'undefined') {
            throw new Error('Cannot append quantity with undefined value.');
        }
        draft.editable.quantity = action.nullableValue;
    });
}

function setName(state: IngredientState, action: Action): IngredientState {
    return produce(state, (draft) => {
        if (action.nullableValue == null) {
            throw new Error('Cannot set name to null or undefined.');
        }
        draft.editable.name = {
            value: action.nullableValue.toLowerCase(),
            _id: action._id,
        };
        draft.editable.type = action.ingrType;
    });
}
function setOtherIngredientProperty(
    state: IngredientState,
    action: Action,
    property: 'unit' | 'prepMethod'
): IngredientState {
    return produce(state, (draft) => {
        if (typeof action.nullableValue === 'undefined') {
            throw new Error(`Cannot set ${property} as undefined.`);
        }
        if (action.nullableValue !== null && action._id === undefined) {
            throw new Error(`Cannot set ${property} without _id.`);
        }
        draft.editable[property] = {
            value: action.nullableValue === null ? null : action.nullableValue.toLowerCase(),
            _id: action._id,
        };
    });
}

function appendQuantity(state: IngredientState, action: Action): IngredientState {
    return produce(state, (draft) => {
        if (typeof action.value === 'undefined') {
            throw new Error(`Cannot append quantity with undefined value.`);
        }
        if (draft.editable.quantity === null) {
            draft.editable.quantity = action.value;
        } else {
            draft.editable.quantity += action.value;
        }
    });
}

function appendOtherIngredientProperty(
    state: IngredientState,
    action: Action,
    property: DBInputState
): IngredientState {
    return produce(state, (draft) => {
        if (typeof action.value === 'undefined') {
            throw new Error(`Cannot append editable ${property} with undefined value.`);
        }
        if (draft.editable[property].value === null) {
            draft.editable[property] = { value: action.value.toLowerCase() };
        } else {
            draft.editable[property].value += action.value.toLowerCase();
        }
    });
}

function getPrevState(state: InputState): InputState {
    const nextState = { quantity: 'quantity', unit: 'quantity', name: 'unit', prepMethod: 'name' };
    return nextState[state] as InputState;
}

function removeFromQuantity(num: number, item: EditableIngredient): EditableIngredient {
    if (num <= 0 || item.state !== 'quantity') {
        return item;
    }

    // number to delete is greater or equal, reset val
    if (item.quantity === null || num >= item.quantity.length) {
        item.quantity = null;
        return item;
    }
    // number to delete is within current state value
    item.quantity = item.quantity.slice(0, item.quantity.length - num);
    return item;
}

function removeFromProperty(
    num: number,
    item: EditableIngredient,
    currentState: DBInputState
): [number, EditableIngredient] {
    if (num <= 0 || item.state !== currentState) {
        return [num, item];
    }
    const val = item[currentState].value;
    // Remove _id if present
    item[currentState]._id = undefined;

    // Current state is empty, decrement state and return item
    if (val === null) {
        item.state = getPrevState(currentState);
        num--;
        return [num, item];
    }
    // number to delete is greater than current state, reset val and decrement state
    if (num > val.length) {
        item[currentState].value = null;
        item.state = getPrevState(currentState);
        return [num - val.length - 1, item];
    }
    // number is equal, just reset val
    if (num === val.length) {
        item[currentState].value = null;
        return [num - val.length, item];
    }
    // number to delete is within current state value
    item[currentState].value = val.slice(0, val.length - num);
    return [0, item];
}

function truncateIngredient(num: number, item: EditableIngredient): EditableIngredient {
    let newItem = { ...item };

    [num, newItem] = removeFromProperty(num, newItem, 'prepMethod');
    [num, newItem] = removeFromProperty(num, newItem, 'name');
    [num, newItem] = removeFromProperty(num, newItem, 'unit');
    newItem = removeFromQuantity(num, newItem);

    return newItem;
}

function getQuantityStr(item: EditableIngredient): string {
    if (item.quantity === null) {
        return '';
    }
    if (item.state !== 'quantity' && isFraction(item.quantity!)) {
        return formatFraction(item.quantity!);
    }
    return `${item.quantity !== null ? item.quantity : ''}`;
}

function getUnitStr(item: EditableIngredient): string {
    if (item.state === 'quantity' || item.quantity === null) {
        return '';
    }
    if (item.state === 'unit') {
        if (item.unit.value === null) {
            return ' ';
        } else {
            return ` ${item.unit.value}`;
        }
    } else {
        if (item.unit.value === null) {
            return '';
        } else {
            return ` ${item.unit.value}`;
        }
    }
}

function getNameStr(item: EditableIngredient): string {
    if (!['name', 'prepMethod'].includes(item.state)) {
        return '';
    }
    const delim = item.quantity === null ? '' : ' ';
    const str = item.name.value !== null ? item.name.value : '';
    return `${delim}${str}`;
}

function getPrepMethodStr(item: EditableIngredient): string {
    const delim = item.state === 'prepMethod' ? ', ' : '';
    const str = item.prepMethod.value !== null ? item.prepMethod.value : '';
    return `${delim}${str}`;
}

function getEditableIngredientStr(item: EditableIngredient): string {
    if (item.quantity === null && item.state === 'quantity') {
        return '';
    }
    const quantityStr = getQuantityStr(item);
    const unitStr = getUnitStr(item);
    const nameStr = getNameStr(item);
    const prepMethodStr = getPrepMethodStr(item);
    return `${quantityStr}${unitStr}${nameStr}${prepMethodStr}`;
}

export function getIngredientStr(
    quantity: string | null | undefined,
    unit: string | null | undefined,
    name: string,
    prepMethod: string | null | undefined
): string {
    let quantityStr = '';
    if (quantity != null) {
        quantityStr = isFraction(quantity) ? formatFraction(quantity) : quantity;
    }
    const unitStr = unit == null ? '' : ` ${unit}`;
    const nameStr = quantity == null ? name : ` ${name}`;
    const prepMethodStr = prepMethod == null ? '' : `, ${prepMethod}`;
    return `${quantityStr}${unitStr}${nameStr}${prepMethodStr}`;
}

export function getFinishedIngredientStr(item: FinishedIngredient): string {
    return getIngredientStr(item.quantity, item.unit.value, item.name.value, item.prepMethod.value);
}

function reducer(state: IngredientState, action: Action): IngredientState {
    switch (action.type) {
        case 'remove_finished_item': {
            return produce(state, (draft) => {
                if (typeof action.index === 'undefined') {
                    throw new Error('index is required to remove finished ingredient.');
                }
                draft.finished.splice(action.index, 1);
            });
        }
        case 'reset_editable': {
            return produce(state, (draft) => {
                draft.editable = getEmptyIngredient();
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
        case 'set_editable_quantity': {
            return setQuantity(state, action);
        }
        case 'set_editable_unit': {
            return setOtherIngredientProperty(state, action, 'unit');
        }
        case 'set_editable_name': {
            return setName(state, action);
        }
        case 'set_editable_prepMethod': {
            return setOtherIngredientProperty(state, action, 'prepMethod');
        }
        case 'set_finished': {
            return produce(state, (draft) => {
                if (typeof action.finished === 'undefined') {
                    throw new Error('finished array cannot be undefined');
                }
                draft.finished = action.finished;
            });
        }
        case 'append_editable_quantity': {
            return appendQuantity(state, action);
        }
        case 'append_editable_unit': {
            return appendOtherIngredientProperty(state, action, 'unit');
        }
        case 'append_editable_name': {
            return appendOtherIngredientProperty(state, action, 'name');
        }
        case 'append_editable_prepMethod': {
            return appendOtherIngredientProperty(state, action, 'prepMethod');
        }
        case 'increment_editable_state': {
            return produce(state, (draft) => {
                const nextState = {
                    quantity: draft.editable.quantity === null ? 'name' : 'unit',
                    unit: 'name',
                    name: 'prepMethod',
                };
                if (draft.editable.state === 'prepMethod') {
                    return;
                }
                draft.editable.state = nextState[draft.editable.state] as InputState;
            });
        }
        case 'decrement_editable_state': {
            return produce(state, (draft) => {
                const nextState = {
                    unit: 'quantity',
                    name: draft.editable.quantity === null ? 'quantity' : 'unit',
                    prepMethod: 'name',
                };
                if (draft.editable.state === 'quantity') {
                    return;
                }
                draft.editable.state = nextState[draft.editable.state] as InputState;
            });
        }
        case 'truncate_editable': {
            return produce(state, (draft) => {
                if (typeof action.num === 'undefined') {
                    throw new Error('num is required to truncate item');
                }
                draft.editable = truncateIngredient(action.num, draft.editable);
            });
        }
        case 'submit_editable': {
            return produce(state, (draft) => {
                if (draft.editable.name === null) {
                    throw new Error('Cannot submit an item with null name.');
                }
                if (typeof draft.editable.type === 'undefined') {
                    throw new Error('Cannot submit an item without an ingredient type.');
                }
                const finished = {
                    key: draft.editable.key,
                    quantity: draft.editable.quantity,
                    unit: draft.editable.unit,
                    name: draft.editable.name as FinishedName,
                    prepMethod: draft.editable.prepMethod,
                    type: draft.editable.type,
                };
                draft.finished.push(finished);
                draft.editable = getEmptyIngredient();
            });
        }
        default: {
            throw Error('Unknown action: ' + action.type);
        }
    }
}

interface ActionTypeHandler {
    set: (value: string | null) => void;
    append: (value: string) => void;
}
interface ActionTypeHandlerFromDB extends Omit<ActionTypeHandler, 'set'> {
    set: (value: string | null, _id?: string, type?: EnumRecipeIngredientType) => void;
}
interface InternalActionHandler {
    incrementState: () => void;
    decrementState: () => void;
    submit: () => void;
    truncate: (num: number) => void;
    quantity: ActionTypeHandler;
    unit: ActionTypeHandlerFromDB;
    name: ActionTypeHandlerFromDB;
    prepMethod: ActionTypeHandlerFromDB;
    reset: () => void;
    setShow: SetShow;
}
interface Get {
    string: () => string;
    currentStateValue: () => string | null;
}
interface SetShow {
    on: () => void;
    off: () => void;
    toggle: () => void;
}
interface Set {
    currentStateItem: (value: string | null, _id?: string, type?: EnumRecipeIngredientType) => void;
    show: SetShow;
}
export interface IngredientActionHandler {
    get: Get;
    set: Set;
    reset: () => void;
    handleSubmit: () => void;
    handleChange: (value: string) => void;
    incrementState: () => void;
    decrementState: () => void;
}
export interface QueryData {
    unit?: GetUnitsQuery['unitMany'];
    ingredient?: GetIngredientsQuery['ingredientMany'];
    recipe?: GetIngredientsQuery['recipeMany'];
    prepMethod?: GetPrepMethodsQuery['prepMethodMany'];
}
export interface UseIngredientListReturnType {
    state: IngredientState;
    actionHandler: IngredientActionHandler;
    setFinished: (finished: FinishedIngredient[]) => void;
    removeFinished: (index: number) => void;
    queryData: QueryData;
}
export function useIngredientList(): UseIngredientListReturnType {
    const { data: unitData } = useQuery(GET_UNITS);
    const { data: ingredientData } = useQuery(GET_INGREDIENTS);
    const { data: prepMethodData } = useQuery(GET_PREP_METHODS);
    const [state, dispatch] = useReducer(reducer, {
        finished: [],
        editable: getEmptyIngredient(),
    });
    const toast = useToast();

    const getIngredientActionHandler = (): IngredientActionHandler => {
        const editableActions: InternalActionHandler = {
            reset: () => dispatch({ type: 'reset_editable' }),
            submit: () => dispatch({ type: 'submit_editable' }),
            truncate: (num: number) => dispatch({ type: 'truncate_editable', num }),
            incrementState: () => dispatch({ type: 'increment_editable_state' }),
            decrementState: () => dispatch({ type: 'decrement_editable_state' }),
            quantity: {
                set: (nullableValue: string | null) =>
                    dispatch({ type: 'set_editable_quantity', nullableValue }),
                append: (value: string) => dispatch({ type: 'append_editable_quantity', value }),
            },
            unit: {
                set: (nullableValue: string | null, _id?: string) =>
                    dispatch({ type: 'set_editable_unit', nullableValue, _id }),
                append: (value: string) => dispatch({ type: 'append_editable_unit', value }),
            },
            name: {
                set: (
                    nullableValue: string | null,
                    _id?: string,
                    type?: EnumRecipeIngredientType
                ) => dispatch({ type: 'set_editable_name', nullableValue, _id, ingrType: type }),
                append: (value: string) => dispatch({ type: 'append_editable_name', value }),
            },
            prepMethod: {
                set: (nullableValue: string | null, _id?: string) =>
                    dispatch({ type: 'set_editable_prepMethod', nullableValue, _id }),
                append: (value: string) => dispatch({ type: 'append_editable_prepMethod', value }),
            },
            setShow: {
                on: () => dispatch({ type: 'set_editable_show', value: 'on' }),
                off: () => dispatch({ type: 'set_editable_show', value: 'off' }),
                toggle: () => dispatch({ type: 'set_editable_show', value: 'toggle' }),
            },
        };

        // Public functions
        const get: Get = {
            string: () => getEditableIngredientStr(state.editable),
            currentStateValue: () => {
                if (state.editable.state === 'quantity') {
                    return state.editable.quantity;
                } else {
                    return state.editable[state.editable.state].value;
                }
            },
        };
        const handleSubmit = () => {
            if (state.editable.state !== 'prepMethod') {
                editableActions.reset();
            } else {
                editableActions.setShow.off();
                editableActions.submit();
            }
        };
        const set: Set = {
            currentStateItem: (
                value: string | null,
                _id?: string,
                type?: EnumRecipeIngredientType
            ) => {
                if (state.editable.state === 'quantity') {
                    editableActions.quantity.set(value);
                } else if (state.editable.state === 'name') {
                    editableActions.name.set(value, _id, type);
                } else {
                    editableActions[state.editable.state].set(value, _id);
                }
                editableActions.incrementState();
            },
            show: editableActions.setShow,
        };
        const handleChange = (value: string) => {
            const diff = getTextDiff(value, get.string());
            try {
                switch (state.editable.state) {
                    case 'quantity':
                        return handleQuantityChange(diff, state.editable, editableActions);
                    case 'unit':
                        return handleUnitChange(diff, state.editable, unitData, editableActions);
                    case 'name':
                        return handleIngredientNameChange(diff, editableActions);
                    case 'prepMethod':
                        return handlePrepMethodChange(diff, editableActions);
                    default:
                        throw new Error(`Unknown state: ${state.editable.state}`);
                }
            } catch (e: unknown) {
                if (e instanceof Error) {
                    toast({
                        title: 'Invalid input',
                        description: e.message,
                        status: 'error',
                        duration: 2000,
                    });
                }
            }
        };

        return {
            get,
            set,
            reset: editableActions.reset,
            handleSubmit,
            handleChange,
            incrementState: editableActions.incrementState,
            decrementState: editableActions.decrementState,
        };
    };
    const actionHandler = getIngredientActionHandler();
    const setFinished = (finished: FinishedIngredient[]) => {
        return dispatch({ type: 'set_finished', finished });
    };
    const removeFinished = (index: number) => {
        return dispatch({ type: 'remove_finished_item', index });
    };
    const queryData = {
        unit: unitData?.unitMany,
        ingredient: ingredientData?.ingredientMany,
        prepMethod: prepMethodData?.prepMethodMany,
        recipe: ingredientData?.recipeMany,
    };

    return {
        state,
        actionHandler,
        setFinished,
        removeFinished,
        queryData,
    };
}
