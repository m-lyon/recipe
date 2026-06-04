import { describe, expect, it } from 'vitest';

import { ingredientDisplayValue } from '@recipe/utils/formatting';
import { getEditableRecipeIngredientStr } from '@recipe/utils/formatting';
import { getFinishedRecipeIngredientStr } from '@recipe/utils/formatting';

describe('getEditableRecipeIngredientStr', () => {
    it('should display plural unit when a fraction greater than 1', () => {
        const item: EditableRecipeIngredient = {
            quantity: '3/2',
            unit: {
                value: 'cup',
                data: {
                    _id: '60f4d2e5c3d5a0a4f1b9c0eb',
                    __typename: 'Unit',
                    shortPlural: 'cups',
                    shortSingular: 'cup',
                    longPlural: 'cups',
                    longSingular: 'cup',
                    preferredNumberFormat: 'fraction',
                    hasSpace: true,
                    unique: true,
                },
            },
            size: { value: null, data: null },
            ingredient: {
                value: 'onion',
                data: {
                    _id: '60f4d2e5c3d5a0a4f1b9c0ec',
                    __typename: 'Ingredient',
                    name: 'onion',
                    pluralName: 'onions',
                    isCountable: true,
                },
            },
            prepMethod: { value: null, data: undefined },
            state: 'prepMethod',
            showDropdown: false,
            popover: null,
        };
        const result = getEditableRecipeIngredientStr(item);
        expect(result).toBe('1½ cups onions, ');
    });

    it('should display plural ingredient when a fraction greater than 1', () => {
        const item: EditableRecipeIngredient = {
            quantity: '3/2',
            unit: { value: null, data: null },
            size: { value: null, data: null },
            ingredient: {
                value: 'onion',
                data: {
                    _id: '60f4d2e5c3d5a0a4f1b9c0ec',
                    __typename: 'Ingredient',
                    name: 'onion',
                    pluralName: 'onions',
                    isCountable: true,
                },
            },
            prepMethod: { value: null, data: undefined },
            state: 'prepMethod',
            showDropdown: false,
            popover: null,
        };
        const result = getEditableRecipeIngredientStr(item);
        expect(result).toBe('1½ onions, ');
    });
});

describe('getFinishedRecipeIngredientStr', () => {
    it('should display plural unit when a fraction greater than 1', () => {
        const item: FinishedRecipeIngredient = {
            quantity: '3/2',
            unit: {
                _id: '60f4d2e5c3d5a0a4f1b9c0eb',
                __typename: 'Unit',
                shortPlural: 'cups',
                shortSingular: 'cup',
                longPlural: 'cups',
                longSingular: 'cup',
                preferredNumberFormat: 'fraction',
                hasSpace: true,
                unique: true,
            },
            size: null,
            ingredient: {
                _id: '60f4d2e5c3d5a0a4f1b9c0ec',
                __typename: 'Ingredient',
                name: 'onion',
                pluralName: 'onions',
                isCountable: true,
            },
            prepMethod: null,
            key: '1',
        };
        const result = getFinishedRecipeIngredientStr(item);
        expect(result).toBe('1½ cups onions');
    });

    it('should display plural ingredient when a fraction greater than 1', () => {
        const item: FinishedRecipeIngredient = {
            quantity: '3/2',
            unit: null,
            size: null,
            ingredient: {
                _id: '60f4d2e5c3d5a0a4f1b9c0ec',
                __typename: 'Ingredient',
                name: 'onion',
                pluralName: 'onions',
                isCountable: true,
            },
            prepMethod: null,
            key: '1',
        };
        const result = getFinishedRecipeIngredientStr(item);
        expect(result).toBe('1½ onions');
    });
});

describe('ingredientDisplayValue — (ve) suffix', () => {
    it('appends (ve) when recipe ingredient has a veganVersion', () => {
        const recipe = {
            __typename: 'Recipe' as const,
            _id: 'r1',
            title: 'Chicken Stock',
            pluralTitle: null,
            veganVersion: { __typename: 'Recipe' as const, _id: 'r2' },
        };
        expect(ingredientDisplayValue(null, null, recipe)).toBe('chicken stock (ve)');
    });

    it('does not append (ve) when recipe ingredient has no veganVersion', () => {
        const recipe = {
            __typename: 'Recipe' as const,
            _id: 'r1',
            title: 'Chicken Stock',
            pluralTitle: null,
            veganVersion: null,
        };
        expect(ingredientDisplayValue(null, null, recipe)).toBe('chicken stock');
    });

    it('appends (ve) to plural title when plural and has veganVersion', () => {
        const recipe = {
            __typename: 'Recipe' as const,
            _id: 'r1',
            title: 'Chicken Stock',
            pluralTitle: 'Chicken Stocks',
            veganVersion: { __typename: 'Recipe' as const, _id: 'r2' },
        };
        expect(ingredientDisplayValue('2', null, recipe)).toBe('chicken stocks (ve)');
    });

    it('does not append (ve) to plural title when no veganVersion', () => {
        const recipe = {
            __typename: 'Recipe' as const,
            _id: 'r1',
            title: 'Chicken Stock',
            pluralTitle: 'Chicken Stocks',
            veganVersion: null,
        };
        // quantity='2', unit=null → plural
        expect(ingredientDisplayValue('2', null, recipe)).toBe('chicken stocks');
    });
});
