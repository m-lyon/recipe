import { isPlural } from '@recipe/utils/plural';
import { autoFormat } from '@recipe/utils/autoformat';
import { ApplyUnitConversion } from '@recipe/features/servings';
import { VALID_NUMBER_REGEX, isRange, validateRange } from '@recipe/utils/number';
import { ingredientDisplayValue, sizeDisplayValue } from '@recipe/utils/formatting';
import { getEditableRecipeIngredientStr, unitDisplayValue } from '@recipe/utils/formatting';

export interface EditableFlow {
    steps: EditableState[];
    finish: (item: EditableRecipeIngredient) => void;
}

interface Context {
    item: EditableRecipeIngredient;
    flow: EditableFlow;
    data: IngredientComponents | undefined;
    apply: ApplyUnitConversion;
}

export const STATES_ORDER: Record<EditableState, number> = {
    quantity: 0,
    unit: 1,
    size: 2,
    ingredient: 3,
    prepMethod: 4,
};

export function getEmptyEditable(): EditableRecipeIngredient {
    return {
        quantity: null,
        unit: { value: null, data: undefined },
        size: { value: null, data: undefined },
        ingredient: { value: null, data: undefined },
        prepMethod: { value: null, data: undefined },
        state: 'quantity',
        showDropdown: false,
        popover: null,
    };
}

function getTextDiff(value: string, origStr: string): string {
    if (value.length > origStr.length) {
        return value.replace(origStr, '');
    }
    return '';
}

function resolveSkippedUnit(ctx: Context) {
    const { item, data } = ctx;
    if (item.quantity === null || item.unit.data !== null) {
        return;
    }
    const each = data?.units.find((unit) => unit.standard === 'each');
    if (each) {
        item.unit = { value: null, data: each };
    }
}

function advance(ctx: Context, to: EditableState | 'next' = 'next') {
    const { item, flow } = ctx;
    item.popover = null;
    const last = flow.steps[flow.steps.length - 1];
    const target =
        to === 'next'
            ? flow.steps.find((step) => STATES_ORDER[step] > STATES_ORDER[item.state])
            : to;
    if (target === undefined || STATES_ORDER[target] > STATES_ORDER[last]) {
        resolveSkippedUnit(ctx);
        flow.finish(item);
        return;
    }
    item.state = target;
}

function append(item: EditableRecipeIngredient, value: string) {
    if (item.state === 'quantity') {
        item.quantity = item.quantity === null ? value : item.quantity + value;
        return;
    }
    const component = item[item.state];
    if (component.value === null) {
        component.value = value;
    } else if (value === ' ') {
        component.value = autoFormat(component.value + value);
    } else {
        component.value += value;
    }
}

function setQuantity(item: EditableRecipeIngredient, value: FinishedQuantity) {
    item.quantity = value;
    if (value === null) {
        item.unit = { value: null, data: null };
    }
}

function setUnit(ctx: Context, data: FinishedUnit) {
    const { item, apply } = ctx;
    const { quantity, unit } = apply({ quantity: item.quantity, unit: data });
    item.quantity = quantity;
    item.unit = {
        value: unit !== null ? unitDisplayValue(quantity, unit, true) : null,
        data: unit,
    };
}

function setSize(item: EditableRecipeIngredient, data: FinishedSize) {
    item.size = { value: data !== null ? sizeDisplayValue(data) : null, data };
    // Set unit if skipping
    if (item.unit.data === undefined) {
        item.unit = { value: null, data: null };
    }
}

function setIngredient(item: EditableRecipeIngredient, data: FinishedIngredient) {
    if (item.unit.data === undefined) {
        item.unit = { value: null, data: null };
    }
    if (item.size.data === undefined) {
        item.size = { value: null, data: null };
    }
    const value =
        data !== null
            ? ingredientDisplayValue(item.quantity, item.unit.data as FinishedUnit, data)
            : null;
    item.ingredient = { value, data };
}

function setPrepMethod(item: EditableRecipeIngredient, data: FinishedPrepMethod) {
    item.prepMethod = { value: data !== null ? data.value : null, data };
}

function hasStep(ctx: Context, step: EditableState) {
    return ctx.flow.steps.includes(step);
}

function handleQuantityChange(ctx: Context, char: string) {
    const { item } = ctx;
    // Validate quantity upon completion
    if (char === ' ' && item.quantity !== null) {
        if (!VALID_NUMBER_REGEX.test(item.quantity)) {
            throw new Error('Invalid quantity.');
        }
        if (isRange(item.quantity)) {
            if (!validateRange(item.quantity)) {
                throw new Error('First number in range must be smaller than second.');
            }
        }
        advance(ctx);
        item.showDropdown = true;
        // Skip quantity with alphabetical characters, when a later step names the thing
    } else if (item.quantity === null && hasStep(ctx, 'size') && /^[a-zA-Z]$/.test(char)) {
        setUnit(ctx, null);
        advance(ctx, 'size');
        item.showDropdown = true;
        handleSizeChange(ctx, char);
        // Starting input should be a number
    } else if (item.quantity === null && /^[\d]$/.test(char)) {
        append(item, char);
        item.showDropdown = false;
        // Valid numerical input
    } else if (item.quantity !== null && /^[\d/.-]$/.test(char)) {
        append(item, char);
        item.showDropdown = false;
        // Throw error for invalid input
    } else {
        throw new Error('Only numbers and fractions are allowed when inputting a quantity.');
    }
}

const VALID_CHAR = /^[a-zA-Z ,.\-"]?$/;
function handleUnitChange(ctx: Context, char: string, data: IngredientComponents) {
    const { item } = ctx;
    if (!VALID_CHAR.test(char)) {
        throw new Error('Invalid character.');
    }
    if (char === ' ') {
        const value = item.unit.value;
        for (const unit of data.units) {
            const names = isPlural(item.quantity)
                ? [unit.longPlural, unit.shortPlural]
                : [unit.longSingular, unit.shortSingular];
            if (names.includes(value ?? '')) {
                setUnit(ctx, unit);
                advance(ctx);
                return;
            }
        }
        if (hasStep(ctx, 'size')) {
            for (const size of data.sizes) {
                if (size.value === value) {
                    setSize(item, size);
                    advance(ctx, 'ingredient');
                    return;
                }
            }
        }
    }
    append(item, char);
}

function handleSizeChange(ctx: Context, char: string) {
    const { item, data } = ctx;
    if (!VALID_CHAR.test(char)) {
        throw new Error('Invalid character.');
    }
    if (char === ' ') {
        const value = item.size.value;
        for (const size of data?.sizes ?? []) {
            if (size.value === value) {
                setSize(item, size);
                advance(ctx);
                return;
            }
        }
    }
    append(item, char);
}

function handleIngredientChange(ctx: Context, char: string) {
    if (!VALID_CHAR.test(char)) {
        throw new Error('Invalid character.');
    }
    append(ctx.item, char);
}

const VALID_CHAR_WITH_NUMBERS = /^[a-zA-Z0-9 ,.\-/"]?$/;
function handlePrepMethodChange(ctx: Context, char: string) {
    // Prep method can contain numbers, to allow for less strict bespoke prep methods.
    if (!VALID_CHAR_WITH_NUMBERS.test(char)) {
        throw new Error('Invalid character.');
    }
    append(ctx.item, char);
}

function setPreviousState(editable: EditableRecipeIngredient) {
    switch (editable.state) {
        case 'quantity':
            break;
        case 'unit':
            editable.state = 'quantity';
            break;
        case 'size':
            if (editable.quantity === null) {
                // this is the scenario where quantity (and therefore unit) have been skipped.
                editable.state = 'quantity';
                break;
            }
            editable.unit.data = undefined;
            editable.state = 'unit';
            break;
        case 'ingredient':
            editable.size.data = undefined;
            editable.state = 'size';
            break;
        case 'prepMethod':
            editable.state = 'ingredient';
            break;
        default:
            break;
    }
}

/** The text of the step being typed: the quantity, or the unit, size, ... typed so far. */
export function getEditableAttributeString(item: EditableRecipeIngredient): string {
    if (item.state === 'quantity') {
        return item.quantity ?? '';
    }
    return item[item.state].value ?? '';
}

export function setEditableAttribute(
    item: EditableRecipeIngredient,
    flow: EditableFlow,
    attr: SetAttr,
    data: IngredientComponents | undefined,
    apply: ApplyUnitConversion
) {
    const ctx = { item, flow, data, apply };
    const inputState = item.state;
    if (typeof attr === 'string') {
        if (inputState !== 'quantity') {
            throw new Error('Cannot set string value after initial state');
        }
        setQuantity(item, attr);
        advance(ctx);
        return;
    }
    if (attr === null) {
        switch (inputState) {
            case 'quantity':
                setQuantity(item, attr);
                setUnit(ctx, attr);
                advance(ctx, 'size');
                break;
            case 'unit':
                setUnit(ctx, attr);
                advance(ctx);
                break;
            case 'size':
                setSize(item, attr);
                advance(ctx);
                break;
            case 'prepMethod':
                setPrepMethod(item, attr);
                advance(ctx);
                break;
            default:
                return;
        }
        resolveSkippedUnit(ctx);
        return;
    }
    if (attr === undefined) {
        // this happens when enter is pressed on an empty dropdown list.
        if (inputState === 'quantity') {
            if (!data) {
                throw new Error('Could not load ingredient components');
            }
            handleQuantityChange(ctx, ' ');
        }
        return;
    }
    switch (attr.__typename) {
        case 'Unit':
            setUnit(ctx, attr);
            advance(ctx, 'size');
            break;
        case 'Size':
            setSize(item, attr);
            advance(ctx, 'ingredient');
            break;
        case 'Ingredient':
        case 'Recipe':
            setIngredient(item, attr);
            advance(ctx, 'prepMethod');
            break;
        case 'PrepMethod':
            setPrepMethod(item, attr);
            advance(ctx);
            break;
        default:
            break;
    }
    resolveSkippedUnit(ctx);
}

export function removeEditableCharacter(item: EditableRecipeIngredient) {
    if (item.state === 'quantity') {
        const currentValue = item.quantity;
        if (currentValue === null) {
            return;
        }
        if (currentValue.length === 1) {
            item.quantity = null;
            item.showDropdown = true;
        } else {
            item.quantity = currentValue.slice(0, -1);
        }
        return;
    }
    const currentItem = item[item.state];
    if (currentItem.value === null) {
        item.popover = null;
        if (item.state === 'unit' && item.quantity !== null) {
            item.showDropdown = false;
        }
        setPreviousState(item);
    } else if (currentItem.value.length === 1) {
        currentItem.value = null;
    } else {
        currentItem.value = currentItem.value.slice(0, -1);
    }
}

export function changeEditable(
    item: EditableRecipeIngredient,
    flow: EditableFlow,
    value: string,
    data: IngredientComponents | undefined,
    apply: ApplyUnitConversion
) {
    const char = getTextDiff(value, getEditableRecipeIngredientStr(item));
    if (!data) {
        throw new Error('Could not load ingredient components');
    }
    const ctx = { item, flow, data, apply };
    switch (item.state) {
        case 'quantity':
            handleQuantityChange(ctx, char);
            break;
        case 'unit':
            handleUnitChange(ctx, char, data);
            break;
        case 'size':
            handleSizeChange(ctx, char);
            break;
        case 'ingredient':
            handleIngredientChange(ctx, char);
            break;
        case 'prepMethod':
            handlePrepMethodChange(ctx, char);
            break;
        default:
            break;
    }
    resolveSkippedUnit(ctx);
}
