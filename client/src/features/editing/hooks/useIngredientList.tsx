import { produce } from 'immer';
import { useReducer } from 'react';
import { useQuery } from '@apollo/client';
import { useToast } from '@chakra-ui/react';

import { GET_UNITS } from '@recipe/graphql/queries/unit';
import { RecipeIngredient } from '@recipe/graphql/generated';
import { GET_INGREDIENTS } from '@recipe/graphql/queries/ingredient';
import { GET_PREP_METHODS } from '@recipe/graphql/queries/prepMethod';
import { Ingredient, IngredientCreate, PrepMethod } from '@recipe/graphql/generated';
import { EnumRecipeIngredientType, Unit, UnitCreate } from '@recipe/graphql/generated';
import { GetIngredientsQuery, GetPrepMethodsQuery, GetUnitsQuery } from '@recipe/graphql/generated';

import { isPlural } from '../../../utils/plural';
import { VALID_NUMBER_REGEX, formatFraction, isFraction } from '../../../utils/number';

export const DEFAULT_INGREDIENT_STR = 'Enter ingredient';

export function dbIngredientToFinished(ingr: RecipeIngredient): FinishedRecipeIngredient {
    return {
        key: crypto.randomUUID(),
        quantity: ingr.quantity as FinishedQuantity,
        unit: ingr.unit as FinishedUnit,
        ingredient: ingr.ingredient as FinishedIngredient,
        prepMethod: ingr.prepMethod as FinishedPrepMethod,
    };
}

type NewChar = string | number;
function handleQuantityChange(
    char: NewChar,
    item: EditableRecipeIngredient,
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
            actionHandler.unit.set(null);
            handleIngredientChange(char, actionHandler);
            // Starting input should be a number
        } else if (item.quantity === null && /^[\d]$/.test(char)) {
            actionHandler.quantity.append(char);
            if (item.show) {
                actionHandler.setShow.off();
            }
            // Valid numerical input
        } else if (item.quantity !== null && /^[\d/.-]$/.test(char)) {
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
    item: EditableRecipeIngredient,
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
                            actionHandler.unit.set(unit);
                            return actionHandler.incrementState();
                        }
                    } else {
                        if (unit.longSingular === unitValue || unit.shortSingular === unitValue) {
                            actionHandler.unit.set(unit);
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

function handleIngredientChange(char: NewChar, actionHandler: InternalActionHandler) {
    if (typeof char === 'number') {
        actionHandler.truncate(char);
    } else {
        if (/^[a-zA-Z -]$/.test(char)) {
            actionHandler.ingredient.append(char);
        } else {
            throw new Error('Only letters and spaces are allowed when inputting an ingredient.');
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
    return '';
}
export type InputState = 'quantity' | 'unit' | 'ingredient' | 'prepMethod';
export type DBInputState = Extract<InputState, 'unit' | 'ingredient' | 'prepMethod'>;
export type Quantity = string | null;
export type Recipe = GetIngredientsQuery['recipeMany'][0];
type EditableQuantity = Quantity;
type FinishedQuantity = Quantity;
interface EditableUnit {
    value: string | null;
    data?: Unit | null;
}
type FinishedUnit = Unit | null;
interface EditableIngredient {
    value: string | null;
    data?: Ingredient | Recipe;
}
type FinishedIngredient = Ingredient | IngredientCreate | Recipe;
interface EditablePrepMethod {
    value: string | null;
    data?: PrepMethod | null;
}
type FinishedPrepMethod = PrepMethod | null;
export interface EditableRecipeIngredient {
    quantity: EditableQuantity;
    unit: EditableUnit;
    ingredient: EditableIngredient;
    prepMethod: EditablePrepMethod;
    state: InputState;
    show: boolean;
    key: string;
    type?: EnumRecipeIngredientType;
}
export interface FinishedRecipeIngredient {
    quantity: FinishedQuantity;
    unit: FinishedUnit;
    ingredient: FinishedIngredient;
    prepMethod: FinishedPrepMethod;
    key: string;
}
export type LikeFinishedRecipeIngredient = Omit<FinishedRecipeIngredient, 'key'>;
type ShowStates = 'on' | 'off' | 'toggle';
interface IngredientState {
    finished: FinishedRecipeIngredient[];
    editable: EditableRecipeIngredient;
}
// Helper functions -------------------------------------------------------------
function getEmptyIngredient(): EditableRecipeIngredient {
    return {
        quantity: null,
        unit: { value: null },
        ingredient: { value: null },
        prepMethod: { value: null },
        state: 'quantity',
        show: false,
        key: crypto.randomUUID(),
    };
}
function getPrevState(state: InputState): InputState {
    const nextState = {
        quantity: 'quantity',
        unit: 'quantity',
        ingredient: 'unit',
        prepMethod: 'ingredient',
    };
    return nextState[state] as InputState;
}
function removeFromQuantity(num: number, item: EditableRecipeIngredient): EditableRecipeIngredient {
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
    item: EditableRecipeIngredient,
    currentState: DBInputState
): [number, EditableRecipeIngredient] {
    if (num <= 0 || item.state !== currentState) {
        return [num, item];
    }
    const val = item[currentState].value;
    // Remove data if present
    item[currentState].data = undefined;

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
// String formatting ------------------------------------------------------------
function getFinishedQuantityStr(quantity: FinishedQuantity): string {
    if (quantity === null) {
        return '';
    }
    if (isFraction(quantity)) {
        return formatFraction(quantity);
    }
    return quantity;
}
function getEditableQuantityStr(item: EditableRecipeIngredient): string {
    if (item.state === 'quantity') {
        return item.quantity === null ? '' : item.quantity;
    }
    return getFinishedQuantityStr(item.quantity);
}
export function unitDisplayValue(
    quantity: FinishedQuantity,
    unit: Unit | UnitCreate,
    short: boolean
): string {
    if (short) {
        return isPlural(quantity) ? unit.shortPlural : unit.shortSingular;
    }
    return isPlural(quantity) ? unit.longPlural : unit.longSingular;
}
function getFinishedUnitStr(quantity: FinishedQuantity, unit: FinishedUnit): string {
    if (unit === null) {
        return '';
    }
    return `${unit.hasSpace ? ' ' : ''}${unitDisplayValue(quantity, unit, true)}`;
}
function getEditableUnitStr(item: EditableRecipeIngredient): string {
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
        return getFinishedUnitStr(item.quantity, item.unit.data!);
    }
}
export function ingredientDisplayStr(
    quantity: FinishedQuantity,
    unit: FinishedUnit,
    ingredient: FinishedIngredient
): string {
    console.log('ingredientDisplayStr', ingredient);
    const plural =
        (isPlural(quantity) && unit === null) ||
        ((ingredient.__typename === 'Ingredient' || ingredient.__typename === 'IngredientCreate') &&
            ingredient.isCountable &&
            unit !== null);
    if (ingredient.__typename === 'Ingredient' || ingredient.__typename === 'IngredientCreate') {
        return plural ? ingredient.pluralName : ingredient.name;
    } else if (ingredient.__typename === 'Recipe') {
        return plural ? ingredient.pluralTitle!.toLowerCase() : ingredient.title.toLowerCase();
    }
    return '';
}
export function getFinishedIngredientStr(
    quantity: FinishedQuantity,
    unit: FinishedUnit,
    ingredient: FinishedIngredient
): string {
    const delim = quantity === null ? '' : ' ';
    return `${delim}${ingredientDisplayStr(quantity, unit, ingredient)}`;
}
function getEditableIngredientStr(item: EditableRecipeIngredient): string {
    if (item.state === 'quantity' || item.state === 'unit') {
        return '';
    }
    if (item.state === 'ingredient') {
        const delim = item.quantity === null ? '' : ' ';
        if (item.ingredient.value === null) {
            return delim;
        } else {
            return `${delim}${item.ingredient.value}`;
        }
    }
    return getFinishedIngredientStr(item.quantity, item.unit.data!, item.ingredient.data!);
}
function getFinishedPrepMethodStr(prepMethod: FinishedPrepMethod): string {
    if (prepMethod === null) {
        return '';
    }
    return `, ${prepMethod.value}`;
}
function getEditablePrepMethodStr(item: EditableRecipeIngredient): string {
    if (item.state !== 'prepMethod') {
        return '';
    }
    const str = item.prepMethod.value !== null ? item.prepMethod.value : '';
    return `, ${str}`;
}
function getEditableRecipeIngredientStr(item: EditableRecipeIngredient): string {
    const quantityStr = getEditableQuantityStr(item);
    const unitStr = getEditableUnitStr(item);
    const ingrStr = getEditableIngredientStr(item);
    const prepMethodStr = getEditablePrepMethodStr(item);
    return `${quantityStr}${unitStr}${ingrStr}${prepMethodStr}`;
}
export function getFinishedRecipeIngredientStr(item: LikeFinishedRecipeIngredient): string {
    const { quantity, unit, ingredient, prepMethod } = item;
    const quantityStr = getFinishedQuantityStr(quantity);
    const unitStr = getFinishedUnitStr(quantity, unit);
    const ingrStr = getFinishedIngredientStr(quantity, unit, ingredient);
    const prepMethodStr = getFinishedPrepMethodStr(prepMethod);
    return `${quantityStr}${unitStr}${ingrStr}${prepMethodStr}`;
}
// Actions ---------------------------------------------------------------------
type Action =
    | RemoveFinishedItemAction
    | ResetEditableAction
    | SetShowAction
    | SetFinishedAction
    | AppendQuantityAction
    | AppendOtherIngredientAction
    | SetQuantityAction
    | SetIngredientAction
    | SetUnitAction
    | SetPrepMethodAction
    | IncrementEditableStateAction
    | DecrementEditableStateAction
    | SubmitEditableAction
    | TruncateEditableAction;
interface RemoveFinishedItemAction {
    type: 'remove_finished_item';
    index: number;
}
function removeFinishedItem(
    state: IngredientState,
    action: RemoveFinishedItemAction
): IngredientState {
    return produce(state, (draft) => {
        draft.finished.splice(action.index, 1);
    });
}
interface ResetEditableAction {
    type: 'reset_editable';
}
function resetEditable(state: IngredientState): IngredientState {
    return produce(state, (draft) => {
        draft.editable = getEmptyIngredient();
    });
}
interface SetShowAction {
    type: 'set_editable_show';
    payload: ShowStates;
}
function setEditableShow(state: IngredientState, action: SetShowAction): IngredientState {
    return produce(state, (draft) => {
        switch (action.payload) {
            case 'on':
                draft.editable.show = true;
                break;
            case 'off':
                draft.editable.show = false;
                break;
            case 'toggle':
                draft.editable.show = !draft.editable.show;
                break;
            default:
                throw new Error('Invalid show state');
        }
    });
}
interface SetFinishedAction {
    type: 'set_finished';
    finished: FinishedRecipeIngredient[];
}
function setFinished(state: IngredientState, action: SetFinishedAction): IngredientState {
    return produce(state, (draft) => {
        draft.finished = action.finished;
    });
}
interface SetQuantityAction {
    type: 'set_editable_quantity';
    payload: string | null;
}
function setQuantity(state: IngredientState, action: SetQuantityAction): IngredientState {
    return produce(state, (draft) => {
        draft.editable.quantity = action.payload;
        if (draft.editable.quantity === null) {
            draft.editable.unit.value = null;
            draft.editable.unit.data = null;
        }
    });
}
interface SetUnitAction {
    type: 'set_editable_unit';
    payload: Unit | null;
}
function setUnit(state: IngredientState, action: SetUnitAction): IngredientState {
    return produce(state, (draft) => {
        // Set data
        draft.editable.unit.data = action.payload;
        // Set value
        if (draft.editable.unit.data === null) {
            draft.editable.unit.value = draft.editable.unit.data;
        } else {
            draft.editable.unit.value = unitDisplayValue(
                draft.editable.quantity,
                draft.editable.unit.data!,
                true
            );
        }
    });
}
interface SetIngredientAction {
    type: 'set_editable_ingredient';
    payload: Ingredient | Recipe;
}
function setIngredient(state: IngredientState, action: SetIngredientAction): IngredientState {
    return produce(state, (draft) => {
        // Set data
        draft.editable.ingredient.data = action.payload;
        // Set value
        if (draft.editable.ingredient.data === null) {
            draft.editable.ingredient.value = null;
        } else {
            draft.editable.ingredient.value = ingredientDisplayStr(
                draft.editable.quantity,
                draft.editable.unit.data!,
                draft.editable.ingredient.data
            );
        }
    });
}
interface SetPrepMethodAction {
    type: 'set_editable_prepMethod';
    payload: PrepMethod | null;
}
function setPrepMethod(state: IngredientState, action: SetPrepMethodAction): IngredientState {
    return produce(state, (draft) => {
        // Set data
        draft.editable.prepMethod.data = action.payload;
        // Set value
        if (draft.editable.prepMethod.data === null) {
            draft.editable.prepMethod.value = null;
        } else {
            draft.editable.prepMethod.value = draft.editable.prepMethod.data.value;
        }
    });
}
interface AppendQuantityAction {
    type: 'append_editable_quantity';
    payload: string;
}
function appendQuantity(state: IngredientState, action: AppendQuantityAction): IngredientState {
    return produce(state, (draft) => {
        if (draft.editable.quantity === null) {
            draft.editable.quantity = action.payload;
        } else {
            draft.editable.quantity += action.payload;
        }
    });
}
interface AppendOtherIngredientAction {
    type: 'append_editable_unit' | 'append_editable_ingredient' | 'append_editable_prepMethod';
    payload: string;
}
function appendOtherIngredient(
    state: IngredientState,
    action: AppendOtherIngredientAction,
    property: DBInputState
): IngredientState {
    return produce(state, (draft) => {
        if (draft.editable[property].value === null) {
            draft.editable[property] = { value: action.payload.toLowerCase() };
        } else {
            draft.editable[property].value += action.payload.toLowerCase();
        }
    });
}
interface IncrementEditableStateAction {
    type: 'increment_editable_state';
}
function incrementEditableState(state: IngredientState): IngredientState {
    return produce(state, (draft) => {
        const nextState = {
            quantity: draft.editable.quantity === null ? 'ingredient' : 'unit',
            unit: 'ingredient',
            ingredient: 'prepMethod',
        };
        if (draft.editable.state === 'prepMethod') {
            return;
        }
        draft.editable.state = nextState[draft.editable.state] as InputState;
    });
}
interface DecrementEditableStateAction {
    type: 'decrement_editable_state';
}
function decrementEditableState(state: IngredientState): IngredientState {
    return produce(state, (draft) => {
        const nextState = {
            unit: 'quantity',
            ingredient: draft.editable.quantity === null ? 'quantity' : 'unit',
            prepMethod: 'ingredient',
        };
        if (draft.editable.state === 'quantity') {
            return;
        }
        draft.editable.state = nextState[draft.editable.state] as InputState;
    });
}
interface TruncateEditableAction {
    type: 'truncate_editable';
    payload: number;
}
function truncateEditable(state: IngredientState, action: TruncateEditableAction): IngredientState {
    return produce(state, (draft) => {
        let newItem = { ...draft.editable };
        [action.payload, newItem] = removeFromProperty(action.payload, newItem, 'prepMethod');
        [action.payload, newItem] = removeFromProperty(action.payload, newItem, 'ingredient');
        [action.payload, newItem] = removeFromProperty(action.payload, newItem, 'unit');
        newItem = removeFromQuantity(action.payload, newItem);
        draft.editable = newItem;
    });
}
interface SubmitEditableAction {
    type: 'submit_editable';
}
function submitEditable(state: IngredientState): IngredientState {
    return produce(state, (draft) => {
        if (draft.editable.unit.data === undefined) {
            throw new Error('Cannot submit an item with undefined unit.');
        }
        if (draft.editable.ingredient.data === undefined) {
            throw new Error('Cannot submit an item with null ingredient.');
        }
        if (draft.editable.prepMethod.data === undefined) {
            throw new Error('Cannot submit an item with null prep method.');
        }
        const finished = {
            key: draft.editable.key,
            quantity: draft.editable.quantity,
            unit: draft.editable.unit.data,
            ingredient: draft.editable.ingredient.data,
            prepMethod: draft.editable.prepMethod.data,
        };
        draft.finished.push(finished);
        draft.editable = getEmptyIngredient();
    });
}
// Reducer ---------------------------------------------------------------------
function reducer(state: IngredientState, action: Action): IngredientState {
    switch (action.type) {
        case 'remove_finished_item': {
            return removeFinishedItem(state, action);
        }
        case 'reset_editable': {
            return resetEditable(state);
        }
        case 'set_editable_show': {
            return setEditableShow(state, action);
        }
        case 'set_editable_quantity': {
            return setQuantity(state, action);
        }
        case 'set_editable_unit': {
            return setUnit(state, action);
        }
        case 'set_editable_ingredient': {
            return setIngredient(state, action);
        }
        case 'set_editable_prepMethod': {
            return setPrepMethod(state, action);
        }
        case 'set_finished': {
            return setFinished(state, action);
        }
        case 'append_editable_quantity': {
            return appendQuantity(state, action);
        }
        case 'append_editable_unit': {
            return appendOtherIngredient(state, action, 'unit');
        }
        case 'append_editable_ingredient': {
            return appendOtherIngredient(state, action, 'ingredient');
        }
        case 'append_editable_prepMethod': {
            return appendOtherIngredient(state, action, 'prepMethod');
        }
        case 'increment_editable_state': {
            return incrementEditableState(state);
        }
        case 'decrement_editable_state': {
            return decrementEditableState(state);
        }
        case 'truncate_editable': {
            return truncateEditable(state, action);
        }
        case 'submit_editable': {
            return submitEditable(state);
        }
        default: {
            throw Error('Unknown action type');
        }
    }
}

interface RecipeIngredientActionHandler<T> {
    set: (attr: T) => void;
    append: (value: string) => void;
}
interface InternalActionHandler {
    incrementState: () => void;
    decrementState: () => void;
    submit: () => void;
    truncate: (num: number) => void;
    quantity: RecipeIngredientActionHandler<Quantity>;
    unit: RecipeIngredientActionHandler<Unit | null>;
    ingredient: RecipeIngredientActionHandler<Ingredient>;
    prepMethod: RecipeIngredientActionHandler<PrepMethod | null>;
    reset: () => void;
    setShow: SetShow;
}
interface SetShow {
    on: () => void;
    off: () => void;
    toggle: () => void;
}
export interface IngredientActionHandler {
    editableStringValue: () => string;
    resetEditable: () => void;
    setCurrentEditableAttribute: (attr: Quantity | Unit | Ingredient | PrepMethod) => void;
    currentEditableAttributeValue: () => string | null;
    setEditableShow: SetShow;
    handleEditableSubmit: () => void;
    handleEditableChange: (value: string) => void;
    decrementEditableState: () => void;
    setFinishedArray: (finished: FinishedRecipeIngredient[]) => void;
    removeFinished: (index: number) => void;
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
            truncate: (num: number) => dispatch({ type: 'truncate_editable', payload: num }),
            incrementState: () => dispatch({ type: 'increment_editable_state' }),
            decrementState: () => dispatch({ type: 'decrement_editable_state' }),
            quantity: {
                set: (quantity: string | null) =>
                    dispatch({ type: 'set_editable_quantity', payload: quantity }),
                append: (value: string) =>
                    dispatch({ type: 'append_editable_quantity', payload: value }),
            },
            unit: {
                set: (unit: Unit | null) => dispatch({ type: 'set_editable_unit', payload: unit }),
                append: (value: string) =>
                    dispatch({ type: 'append_editable_unit', payload: value }),
            },
            ingredient: {
                set: (ingredient: Ingredient | Recipe) =>
                    dispatch({ type: 'set_editable_ingredient', payload: ingredient }),
                append: (value: string) =>
                    dispatch({ type: 'append_editable_ingredient', payload: value }),
            },
            prepMethod: {
                set: (prepMethod: PrepMethod | null) =>
                    dispatch({ type: 'set_editable_prepMethod', payload: prepMethod }),
                append: (value: string) =>
                    dispatch({ type: 'append_editable_prepMethod', payload: value }),
            },
            setShow: {
                on: () => dispatch({ type: 'set_editable_show', payload: 'on' }),
                off: () => dispatch({ type: 'set_editable_show', payload: 'off' }),
                toggle: () => dispatch({ type: 'set_editable_show', payload: 'toggle' }),
            },
        };

        // Public functions
        const editableStringValue = () => getEditableRecipeIngredientStr(state.editable);
        const currentEditableAttributeValue = () => {
            if (state.editable.state === 'quantity') {
                return state.editable.quantity;
            } else {
                return state.editable[state.editable.state].value;
            }
        };
        const handleEditableSubmit = () => {
            if (state.editable.state !== 'prepMethod') {
                editableActions.reset();
            } else {
                editableActions.setShow.off();
                editableActions.submit();
            }
        };
        const setCurrentEditableAttribute = (attr: Quantity | Unit | Ingredient | PrepMethod) => {
            if (state.editable.state === 'quantity') {
                editableActions.quantity.set(attr as Quantity);
            } else if (state.editable.state === 'unit') {
                editableActions.unit.set(attr as Unit);
            } else if (state.editable.state === 'ingredient') {
                editableActions.ingredient.set(attr as Ingredient);
            } else if (state.editable.state === 'prepMethod') {
                editableActions.prepMethod.set(attr as PrepMethod);
            }
            editableActions.incrementState();
        };
        const handleEditableChange = (value: string) => {
            const diff = getTextDiff(value, getEditableRecipeIngredientStr(state.editable));
            try {
                switch (state.editable.state) {
                    case 'quantity':
                        return handleQuantityChange(diff, state.editable, editableActions);
                    case 'unit':
                        return handleUnitChange(diff, state.editable, unitData, editableActions);
                    case 'ingredient':
                        return handleIngredientChange(diff, editableActions);
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
        const setFinishedArray = (finished: FinishedRecipeIngredient[]) => {
            return dispatch({ type: 'set_finished', finished });
        };
        const removeFinished = (index: number) => {
            return dispatch({ type: 'remove_finished_item', index });
        };

        return {
            editableStringValue,
            resetEditable: editableActions.reset,
            currentEditableAttributeValue,
            setCurrentEditableAttribute,
            setEditableShow: editableActions.setShow,
            handleEditableSubmit,
            handleEditableChange,
            decrementEditableState: editableActions.decrementState,
            setFinishedArray,
            removeFinished,
        };
    };
    const actionHandler = getIngredientActionHandler();
    const queryData = {
        unit: unitData?.unitMany,
        ingredient: ingredientData?.ingredientMany,
        prepMethod: prepMethodData?.prepMethodMany,
        recipe: ingredientData?.recipeMany,
    };

    return {
        state,
        actionHandler,
        queryData,
    };
}
