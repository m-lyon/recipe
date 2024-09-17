import { describe, expect, it } from 'vitest';

import { InputState } from '@recipe/types';
import { getEditableRecipeIngredientStr } from '@recipe/utils/formatting';
import { getFinishedRecipeIngredientStr } from '@recipe/utils/formatting';
import { EnumUnitPreferredNumberFormat } from '@recipe/graphql/generated';
import { EnumRecipeIngredientType, Ingredient, Unit } from '@recipe/graphql/generated';

describe('getEditableRecipeIngredientStr', () => {
    it('should display plural unit when a fraction greater than 1', () => {
        const item = {
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
                    preferredNumberFormat: EnumUnitPreferredNumberFormat.Fraction,
                    hasSpace: true,
                    unique: true,
                    owner: '60f4d2e5c3d5a0a5f1b9c0eb',
                } satisfies Unit as Unit,
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
                    owner: '60f4d2e5c3d5a0a5f1b9c0eb',
                    tags: [],
                } satisfies Ingredient as Ingredient,
            },
            prepMethod: { value: null },
            state: 'prepMethod' satisfies InputState as InputState,
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
                    owner: '60f4d2e5c3d5a0a5f1b9c0eb',
                    tags: [],
                } satisfies Ingredient as Ingredient,
            },
            prepMethod: { value: null },
            state: 'prepMethod' satisfies InputState as InputState,
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
                _id: '60f4d2e5c3d5a0a4f1b9c0eb',
                __typename: 'Unit',
                shortPlural: 'cups',
                shortSingular: 'cup',
                longPlural: 'cups',
                longSingular: 'cup',
                preferredNumberFormat: EnumUnitPreferredNumberFormat.Fraction,
                hasSpace: true,
                unique: true,
                owner: '60f4d2e5c3d5a0a5f1b9c0eb',
            } satisfies Unit as Unit,
            size: null,
            ingredient: {
                _id: '60f4d2e5c3d5a0a4f1b9c0ec',
                __typename: 'Ingredient',
                name: 'onion',
                pluralName: 'onions',
                isCountable: true,
                owner: '60f4d2e5c3d5a0a5f1b9c0eb',
                tags: [],
            } satisfies Ingredient as Ingredient,
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
            size: null,
            ingredient: {
                _id: '60f4d2e5c3d5a0a4f1b9c0ec',
                __typename: 'Ingredient',
                name: 'onion',
                pluralName: 'onions',
                isCountable: true,
                owner: '60f4d2e5c3d5a0a5f1b9c0eb',
                tags: [],
            } satisfies Ingredient as Ingredient,
            prepMethod: null,
            key: '1',
        };
        const result = getFinishedRecipeIngredientStr(item);
        expect(result).toBe('1½ onions');
    });
});
