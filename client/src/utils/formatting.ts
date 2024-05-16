import { LikeFinishedRecipeIngredient } from '@recipe/types';
import { Unit, UnitCreate } from '@recipe/graphql/generated';
import { EditableRecipeIngredient, FinishedQuantity } from '@recipe/types';
import { FinishedIngredient, FinishedPrepMethod, FinishedUnit } from '@recipe/types';

import { isPlural } from './plural';
import { formatFraction, isFraction } from './number';

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
export function getEditableRecipeIngredientStr(item: EditableRecipeIngredient): string {
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
