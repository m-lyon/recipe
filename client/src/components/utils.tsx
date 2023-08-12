import { Ingredient, ActionHandler } from '../hooks/useIngredientList';
export const DEFAULT_INGREDIENT_STR = 'Enter ingredient';

const validateAmount = (char: string, item: Ingredient): boolean => {
    if (char === ' ' && item.isEdited) {
        return true;
    }
    return !isNaN(parseInt(char)) || char === '/';
};
const validateUnit = (char: string): boolean => /^[a-zA-Z ]$/.test(char);
const validateName = (char: string): boolean => /^[a-zA-Z ]$/.test(char);

type NewChar = string | number;
export function handleAmountChange(char: NewChar, item: Ingredient, actionHandler: ActionHandler) {
    if (typeof char === 'number') {
        console.log(`truncating by ${char} characters`);
        actionHandler.truncate(char);
    } else {
        if (validateAmount(char, item)) {
            if (!item.isEdited) {
                actionHandler.toggleEdited();
                actionHandler.amount.set(char);
            } else if (char === ' ') {
                console.log('changing state from "amnt" to "unit"');
                actionHandler.incrementState();
            } else {
                actionHandler.amount.append(char);
            }
        } else {
            if (!item.isEdited) {
                actionHandler.amount.set('');
                // Could do some red text warning here
            }
            console.log(`invalid char given: "${char}"`);
        }
    }
}

export function handleUnitChange(char: NewChar, actionHandler: ActionHandler) {
    if (typeof char === 'number') {
        console.log(`truncating by ${char} characters`);
        actionHandler.truncate(char);
    } else {
        if (validateUnit(char)) {
            if (char === ' ') {
                console.log('changing state from "unit" to "ingr"');
                actionHandler.incrementState();
            } else {
                console.log(`adding char ${char}`);
                actionHandler.unit.append(char);
            }
        } else {
            console.log(`invalid char given: "${char}"`);
        }
    }
}

export function handleNameChange(char: NewChar, actionHandler: ActionHandler) {
    console.log(`name char: ${char}`);
    if (typeof char === 'number') {
        console.log(`truncating by ${char} characters`);
        actionHandler.truncate(char);
    } else {
        if (validateName(char)) {
            actionHandler.name.append(char);
        } else {
            console.log(`invalid char given: "${char}"`);
        }
    }
}

export function getTextDiff(
    value: string,
    item: Ingredient,
    actionHandler: ActionHandler
): NewChar {
    // TODO: need to disallow copy and pasting
    const origStr = actionHandler.getStr();
    if (!item.isEdited) {
        return value.replace(DEFAULT_INGREDIENT_STR, '');
    }
    if (value.length > origStr.length) {
        return value.replace(origStr, '');
    }
    if (value.length < origStr.length) {
        console.log('diff is', origStr.length - value.length);
        return origStr.length - value.length;
    }
    console.log('this shouldnt happen');
    return '';
}

export function handleIngredientChange(
    value: string,
    item: Ingredient,
    actionHandler: ActionHandler
) {
    const diff = getTextDiff(value, item, actionHandler);
    switch (item.state) {
        case 'amount': {
            return handleAmountChange(diff, item, actionHandler);
        }
        case 'unit': {
            return handleUnitChange(diff, actionHandler);
        }
        case 'name': {
            return handleNameChange(diff, actionHandler);
        }
    }
}

export function handleIngredientSubmit(
    value: string,
    item: Ingredient,
    actionHandler: ActionHandler
) {
    if (item.state !== 'name') {
        console.log('ingredient not finished, resetting.');
        actionHandler.reset();
    } else {
        console.log('submitted value:', value, item);
        actionHandler.addEmpty();
    }
}
