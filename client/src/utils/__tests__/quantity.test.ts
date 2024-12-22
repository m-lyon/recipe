import { describe, expect, it } from 'vitest';

import { changeQuantity } from '../quantity';

interface IngredientInput {
    quantity?: string | null;
    unit?: UnitView;
    ingredient?: IngredientView;
}

describe('changeQuantity', () => {
    const getIngredient = (ingr: IngredientInput) => {
        const ingredient = {
            __typename: 'Ingredient',
            _id: '030f1b5b-1b1b-4b1b-8b1b-2b1bfb1b4b1b',
            isCountable: false,
            name: 'flour',
            pluralName: 'flours',
        };
        const unit: RecipeIngredientView['unit'] = {
            __typename: 'Unit',
            _id: '030f1b5b-1b1b-4b1b-8b1b-2b1b3b1b4b1b',
            hasSpace: false,
            longPlural: 'cups',
            longSingular: 'cup',
            shortPlural: 'cups',
            shortSingular: 'cup',
            preferredNumberFormat: 'fraction',
            unique: true,
        };
        const recipeIngredient: RecipeIngredientView = {
            __typename: 'RecipeIngredient',
            _id: '030f1b5b-1b1b-4b1b-8b1b-2b1b3b1b4b1b',
            quantity: '1',
            ingredient,
            size: null,
            prepMethod: null,
            unit,
            ...ingr,
        };
        return recipeIngredient;
    };
    it('should return the same ingredient if no change', () => {
        const ingr = getIngredient({ quantity: '1' });
        const newServings = 4;
        const oldServings = 4;
        const result = changeQuantity(ingr, newServings, oldServings, (ingr) => ingr);
        expect(result).toEqual(ingr);
    });

    it('should return the same ingredient if quantity is null', () => {
        const ingr = getIngredient({ quantity: null });
        const newServings = 4;
        const oldServings = 2;
        const result = changeQuantity(ingr, newServings, oldServings, (ingr) => ingr);
        expect(result).toEqual(ingr);
    });

    it('should adjust quantity to whole number when quantity is a fraction', () => {
        const ingr = getIngredient({ quantity: '1/2' });
        const newServings = 8;
        const oldServings = 4;
        const result = changeQuantity(ingr, newServings, oldServings, (ingr) => ingr);
        expect(result.quantity).toBe('1');
    });

    it('should adjust quantity to whole number when quantity is a decimal', () => {
        const ingr = getIngredient({ quantity: '0.5' });
        const newServings = 8;
        const oldServings = 4;
        const result = changeQuantity(ingr, newServings, oldServings, (ingr) => ingr);
        expect(result.quantity).toBe('1');
    });

    it('should adjust quantity to fraction when unit preferred number format is fraction', () => {
        const ingr = getIngredient({ quantity: '1' });
        ingr.unit!.preferredNumberFormat = 'fraction';
        const newServings = 6;
        const oldServings = 4;
        const result = changeQuantity(ingr, newServings, oldServings, (ingr) => ingr);
        expect(result.quantity).toBe('3/2');
    });

    it('should adjust quantity to fraction when unit is missing', () => {
        const ingr = getIngredient({ quantity: '1' });
        ingr.unit = null;
        const newServings = 6;
        const oldServings = 4;
        const result = changeQuantity(ingr, newServings, oldServings, (ingr) => ingr);
        expect(result.quantity).toBe('3/2');
    });

    it('should adjust quantity to decimal when unit preferred number format is decimal', () => {
        const ingr = getIngredient({ quantity: '1/1' });
        ingr.unit!.preferredNumberFormat = 'decimal';
        const newServings = 6;
        const oldServings = 4;
        const result = changeQuantity(ingr, newServings, oldServings, (ingr) => ingr);
        expect(result.quantity).toBe('1.5');
    });
});
