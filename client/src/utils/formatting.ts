import { STATES_ORDER } from '@recipe/stores';

import { isPlural } from './plural';
import { formatFloat, formatFraction, isFraction, isRange } from './number';

// Quantity -------------------------------------------------------------
function getEditableQuantityStr(item: EditableRecipeIngredient): string {
    if (STATES_ORDER[item.state] === STATES_ORDER['quantity']) {
        return item.quantity === null ? '' : item.quantity;
    }
    return getFinishedQuantityStr(item.quantity);
}
function getFinishedQuantityStr(quantity: FinishedQuantity): string {
    if (quantity === null) {
        return '';
    }
    if (isRange(quantity)) {
        const [start, end] = quantity.split('-');
        const space = isFraction(start) || isFraction(end) ? ' ' : '';
        return `${getFinishedQuantityStr(start)}${space}-${space}${getFinishedQuantityStr(end)}`;
    }
    if (isFraction(quantity)) {
        return formatFraction(quantity);
    }
    return formatFloat(quantity);
}
// Unit -----------------------------------------------------------------
function getEditableUnitStr(item: EditableRecipeIngredient): string {
    if (STATES_ORDER[item.state] < STATES_ORDER['unit'] || item.quantity === null) {
        return '';
    }
    if (STATES_ORDER[item.state] === STATES_ORDER['unit']) {
        if (item.unit.value === null) {
            return ' ';
        } else {
            return ` ${item.unit.value}`;
        }
    } else {
        return getFinishedUnitStr(item.quantity, item.unit.data!);
    }
}
function getFinishedUnitStr(quantity: FinishedQuantity, unit: FinishedUnit): string {
    if (unit === null) {
        return '';
    }
    return `${unit.hasSpace ? ' ' : ''}${unitDisplayValue(quantity, unit, true)}`;
}
export function unitDisplayValue(
    quantity: FinishedQuantity,
    unit: NonNullable<FinishedUnit>,
    short: boolean
): string {
    if (short) {
        return isPlural(quantity) ? unit.shortPlural : unit.shortSingular;
    }
    return isPlural(quantity) ? unit.longPlural : unit.longSingular;
}
// Size -----------------------------------------------------------------
function getEditableSizeStr(item: EditableRecipeIngredient): string {
    if (STATES_ORDER[item.state] < STATES_ORDER['size']) {
        return '';
    }
    if (STATES_ORDER[item.state] === STATES_ORDER['size']) {
        const delim = item.quantity === null ? '' : ' ';
        if (item.size.value === null) {
            return delim;
        } else {
            return `${delim}${item.size.value}`;
        }
    } else {
        return getFinishedSizeStr(item.quantity, item.size.data!);
    }
}
function getFinishedSizeStr(quantity: FinishedQuantity, size: FinishedSize): string {
    if (size === null) {
        return '';
    }
    const delim = quantity === null ? '' : ' ';
    return `${delim}${sizeDisplayValue(size)}`;
}
export function sizeDisplayValue(size: FinishedSize): string {
    return size === null ? '' : size.value;
}
// Ingredient -----------------------------------------------------------
function getEditableIngredientStr(item: EditableRecipeIngredient): string {
    if (STATES_ORDER[item.state] < STATES_ORDER['ingredient']) {
        return '';
    }
    if (STATES_ORDER[item.state] === STATES_ORDER['ingredient']) {
        const delim = item.quantity === null && item.size.value === null ? '' : ' ';
        if (item.ingredient.value === null) {
            return delim;
        } else {
            return `${delim}${item.ingredient.value}`;
        }
    }
    return getFinishedIngredientStr(
        item.quantity,
        item.unit.data ?? null,
        item.size.data ?? null,
        item.ingredient.data!
    );
}
export function getFinishedIngredientStr(
    quantity: FinishedQuantity,
    unit: FinishedUnit,
    size: FinishedSize,
    ingredient: FinishedIngredient
): string {
    const delim = quantity === null && size === null ? '' : ' ';
    return `${delim}${ingredientDisplayValue(quantity, unit, ingredient)}`;
}
export function ingredientDisplayValue(
    quantity: FinishedQuantity,
    unit: FinishedUnit,
    ingredient: FinishedIngredient
): string {
    const plural =
        (isPlural(quantity) && unit === null) ||
        (ingredient.__typename === 'Ingredient' && ingredient.isCountable && unit !== null);
    if (ingredient.__typename === 'Ingredient') {
        return plural ? ingredient.pluralName : ingredient.name;
    } else if (ingredient.__typename === 'Recipe') {
        return plural ? ingredient.pluralTitle!.toLowerCase() : ingredient.title.toLowerCase();
    }
    return '';
}
// PrepMethod -----------------------------------------------------------
function getEditablePrepMethodStr(item: EditableRecipeIngredient): string {
    if (STATES_ORDER[item.state] < STATES_ORDER['prepMethod']) {
        return '';
    }
    const str = item.prepMethod.value !== null ? item.prepMethod.value : '';
    return `, ${str}`;
}
function getFinishedPrepMethodStr(prepMethod: FinishedPrepMethod): string {
    if (prepMethod === null) {
        return '';
    }
    return `, ${prepMethodDisplayValue(prepMethod)}`;
}
export function prepMethodDisplayValue(prepMethod: NonNullable<FinishedPrepMethod>): string {
    return prepMethod.value;
}
// RecipeIngredient -----------------------------------------------------
export function getEditableRecipeIngredientStr(item: EditableRecipeIngredient): string {
    const quantityStr = getEditableQuantityStr(item);
    const unitStr = getEditableUnitStr(item);
    const sizeStr = getEditableSizeStr(item);
    const ingrStr = getEditableIngredientStr(item);
    const prepMethodStr = getEditablePrepMethodStr(item);
    return `${quantityStr}${unitStr}${sizeStr}${ingrStr}${prepMethodStr}`;
}
function getFinishedRecipeIngredientStrings(item: Omit<FinishedRecipeIngredient, 'key'>): string[] {
    const { quantity, unit, size, ingredient, prepMethod } = item;
    return [
        getFinishedQuantityStr(quantity),
        getFinishedUnitStr(quantity, unit),
        getFinishedSizeStr(quantity, size),
        getFinishedIngredientStr(quantity, unit, size, ingredient),
        getFinishedPrepMethodStr(prepMethod),
    ];
}
export function getFinishedRecipeIngredientStr(
    item: Omit<FinishedRecipeIngredient, 'key'>
): string {
    return getFinishedRecipeIngredientStrings(item).join('');
}
export function getFinishedRecipeIngredientParts(item: Omit<FinishedRecipeIngredient, 'key'>) {
    const [quantityStr, ...rest] = getFinishedRecipeIngredientStrings(item);
    return { quantity: quantityStr, rest: rest.join('') };
}
export function displayValue(
    item: EditableRecipeIngredient,
    choice: RecipeIngredientDropdown
): string {
    if (typeof choice === 'string') {
        return choice;
    }
    switch (choice?.__typename) {
        case 'Unit':
            return unitDisplayValue(item.quantity, choice, false);
        case 'Size':
            return sizeDisplayValue(choice);
        case 'Ingredient':
        case 'Recipe':
            return ingredientDisplayValue(item.quantity, item.unit.data ?? null, choice);
        case 'PrepMethod':
            return prepMethodDisplayValue(choice);
        default:
            return '';
    }
}
