import { useState } from 'react';
import { ActionHandler, Ingredient } from './useIngredientList';

type NewChar = string | number;
type InputState = 'amnt' | 'unit' | 'ingr';
export function useIngredientHandler(defaultStr: string, defaultState: InputState = 'amnt') {
    const [inputState, setInputState] = useState<InputState>(defaultState);

    function getIngredientStr(item: Ingredient): string {
        const amountStr = `${item.amount !== null ? item.amount : defaultStr}`;
        const unitStr = `${inputState !== 'amnt' ? ' ' : ''}${item.unit !== null ? item.unit : ''}`;
        const ingrStr = `${inputState === 'ingr' ? ' ' : ''}${
            item.ingredient !== null ? item.ingredient : ''
        }`;
        return `${amountStr}${unitStr}${ingrStr}`;
    }

    const validateAmount = (char: string, item: Ingredient): boolean => {
        if (char === ' ' && item.isEdited) {
            return true;
        }
        return !isNaN(parseInt(char)) || char === '/';
    };
    const validateUnit = (char: string): boolean => /^[a-zA-Z ]$/.test(char);
    const validateIngredient = (char: string): boolean => /^[a-zA-Z ]$/.test(char);
    // TODO: move state to inputState useIngredientList state,
    // Move this code to EditableIngredient.

    function handleAmountChange(char: NewChar, item: Ingredient, actionHandler: ActionHandler) {
        if (typeof char === 'number') {
            // TODO: delete characters
        } else {
            if (validateAmount(char, item)) {
                if (!item.isEdited) {
                    actionHandler.toggleEdited();
                    actionHandler.amount.set(char);
                } else if (char === ' ') {
                    console.log('changing state from "amnt" to "unit"');
                    setInputState('unit');
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

    function handleUnitChange(char: NewChar, actionHandler: ActionHandler) {
        if (typeof char === 'number') {
        } else {
            if (validateUnit(char)) {
                if (char === ' ') {
                    console.log('changing state from "unit" to "ingr"');
                    setInputState('ingr');
                } else {
                    console.log(`adding char ${char}`);
                    actionHandler.unit.append(char);
                }
            } else {
                console.log(`invalid char given: "${char}"`);
            }
        }
    }

    function handleIngredientChange(char: NewChar, actionHandler: ActionHandler) {
        console.log(`ingredient char: ${char}`);
        if (typeof char === 'number') {
        } else {
            if (validateIngredient(char)) {
                actionHandler.ingredient.append(char);
            } else {
                console.log(`invalid char given: "${char}"`);
            }
        }
    }

    function getNewChar(value: string, item: Ingredient): NewChar {
        // TODO: need to disallow copy and pasting
        const origStr = getIngredientStr(item);
        if (!item.isEdited) {
            return value.replace(defaultStr, '');
        }
        if (value.length > origStr.length) {
            return value.replace(origStr, '');
        }
        if (value.length < origStr.length) {
            // TODO: need to decide how to handle multiple char deletes
            return 1;
        }
        console.log('this shouldnt happen');
        return '';
    }

    function handleChange(value: string, item: Ingredient, actionHandler: ActionHandler) {
        const newChar = getNewChar(value, item);
        switch (inputState) {
            case 'amnt': {
                return handleAmountChange(newChar, item, actionHandler);
            }
            case 'unit': {
                return handleUnitChange(newChar, actionHandler);
            }
            case 'ingr': {
                return handleIngredientChange(newChar, actionHandler);
            }
        }
    }

    function handleSubmit(value: string, item: Ingredient, actionHandler: ActionHandler) {
        if (inputState !== 'ingr') {
            console.log('ingredient not finished, resetting.');
            setInputState('amnt');
            actionHandler.reset();
        } else {
            console.log('submitted value:', value, item);
            actionHandler.addEmpty();
        }
    }

    return { getIngredientStr, handleChange, handleSubmit };
}
