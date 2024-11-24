import { describe, expect, it } from 'vitest';

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
            key: '1',
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
            key: '1',
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
