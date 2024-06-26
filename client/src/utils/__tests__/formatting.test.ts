import { describe, expect, it } from 'vitest';

import { InputState } from '@recipe/types';
import { getEditableRecipeIngredientStr } from '@recipe/utils/formatting';
import { getFinishedRecipeIngredientStr } from '@recipe/utils/formatting';
import { EnumRecipeIngredientType, Ingredient, Unit } from '@recipe/graphql/generated';

describe('getEditableRecipeIngredientStr', () => {
    it('should display plural unit when a fraction greater than 1', () => {
        const item = {
            quantity: '3/2',
            unit: {
                value: 'cup',
                data: {
                    __typename: 'Unit',
                    shortPlural: 'cups',
                    shortSingular: 'cup',
                    longPlural: 'cups',
                    longSingular: 'cup',
                    preferredNumberFormat: 'fraction',
                    hasSpace: true,
                } as Unit,
            },
            ingredient: {
                value: 'onion',
                data: {
                    __typename: 'Ingredient',
                    name: 'onion',
                    pluralName: 'onions',
                    isCountable: true,
                } as Ingredient,
            },
            prepMethod: { value: null },
            state: 'prepMethod' as InputState,
            show: true,
            key: '1',
            type: EnumRecipeIngredientType.Ingredient,
        };
        const result = getEditableRecipeIngredientStr(item);
        expect(result).toBe('1½ cups onions, ');
    });

    it('should display plural ingredient when a fraction greater than 1', () => {
        const item = {
            quantity: '3/2',
            unit: {
                value: null,
                data: null,
            },
            ingredient: {
                value: 'onion',
                data: {
                    __typename: 'Ingredient',
                    name: 'onion',
                    pluralName: 'onions',
                    isCountable: true,
                } as Ingredient,
            },
            prepMethod: { value: null },
            state: 'prepMethod' as InputState,
            show: true,
            key: '1',
            type: EnumRecipeIngredientType.Ingredient,
        };
        const result = getEditableRecipeIngredientStr(item);
        expect(result).toBe('1½ onions, ');
    });
});

describe('getFinishedRecipeIngredientStr', () => {
    it('should display plural unit when a fraction greater than 1', () => {
        const item = {
            quantity: '3/2',
            unit: {
                __typename: 'Unit',
                shortPlural: 'cups',
                shortSingular: 'cup',
                longPlural: 'cups',
                longSingular: 'cup',
                preferredNumberFormat: 'fraction',
                hasSpace: true,
            } as Unit,
            ingredient: {
                __typename: 'Ingredient',
                name: 'onion',
                pluralName: 'onions',
                isCountable: true,
            } as Ingredient,
            prepMethod: null,
            key: '1',
        };
        const result = getFinishedRecipeIngredientStr(item);
        expect(result).toBe('1½ cups onions');
    });

    it('should display plural ingredient when a fraction greater than 1', () => {
        const item = {
            quantity: '3/2',
            unit: null,
            ingredient: {
                __typename: 'Ingredient',
                name: 'onion',
                pluralName: 'onions',
                isCountable: true,
            } as Ingredient,
            prepMethod: null,
            key: '1',
        };
        const result = getFinishedRecipeIngredientStr(item);
        expect(result).toBe('1½ onions');
    });
});
