import { describe, expect, it } from 'vitest';

import { mockLarge } from '@recipe/graphql/queries/__mocks__/size';
import { mockChopped } from '@recipe/graphql/queries/__mocks__/prepMethod';
import { mockEach, mockMilliliter, mockTeaspoon } from '@recipe/graphql/queries/__mocks__/unit';
import { mockCup, mockGram, mockKilogram, mockOunce } from '@recipe/graphql/queries/__mocks__/unit';

import { IngredientMeasureData, grams, quantityToFloat } from '../nutrition';
import { calculateIngredientNutrition, sumRecipeNutrition } from '../nutrition';
import { MacroNutrients, NutritionalInfoData, addMacros, findMeasure } from '../nutrition';

// ---------------------------------------------------------------------------
// quantityToFloat
// ---------------------------------------------------------------------------
describe('quantityToFloat', () => {
    it('parses an integer string', () => {
        expect(quantityToFloat('2')).toBe(2);
    });

    it('parses a decimal string', () => {
        expect(quantityToFloat('1.5')).toBe(1.5);
    });

    it('parses a fraction string', () => {
        expect(quantityToFloat('1/2')).toBeCloseTo(0.5);
    });

    it('parses a range and returns the midpoint', () => {
        expect(quantityToFloat('1-3')).toBe(2);
    });

    it('parses a fraction range and returns the midpoint', () => {
        expect(quantityToFloat('1/4-3/4')).toBeCloseTo(0.5);
    });

    it('parses a mixed number like "1 1/2"', () => {
        expect(quantityToFloat('1 1/2')).toBeCloseTo(1.5);
    });

    it('returns NaN for a non-numeric string (raw parse behaviour)', () => {
        const result = quantityToFloat('abc');
        expect(isNaN(result)).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// addMacros
// ---------------------------------------------------------------------------
describe('addMacros', () => {
    it('sums two MacroNutrient objects', () => {
        const a: MacroNutrients = { calories: 100, protein: 10, carbs: 20, fat: 5 };
        const b: MacroNutrients = { calories: 50, protein: 5, carbs: 10, fat: 2 };
        expect(addMacros(a, b)).toEqual({ calories: 150, protein: 15, carbs: 30, fat: 7 });
    });
});

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

const large = { __typename: 'Size' as const, _id: mockLarge._id, value: 'large' };
const chopped = { __typename: 'PrepMethod' as const, _id: mockChopped._id, value: 'chopped' };

function makeIngredient(overrides: Partial<RecipeIngredientView> = {}): RecipeIngredientView {
    return {
        __typename: 'RecipeIngredient',
        _id: 'ri-1',
        quantity: '2',
        unit: mockEach,
        size: null,
        prepMethod: null,
        ingredient: {
            __typename: 'Ingredient',
            _id: 'ing-1',
            name: 'onion',
        },
        ...overrides,
    } as unknown as RecipeIngredientView;
}

function measure(
    unit: IngredientMeasureData['unit'],
    gramsPerUnit: number,
    extra: Partial<IngredientMeasureData> = {}
): IngredientMeasureData {
    return {
        __typename: 'IngredientMeasure',
        _id: `m-${unit._id}-${gramsPerUnit}`,
        ingredient: 'ing-1',
        grams: gramsPerUnit,
        unit,
        size: null,
        prepMethod: null,
        ...extra,
    };
}

const perGramMacros: MacroNutrients = { calories: 4, protein: 0.1, carbs: 0.8, fat: 0.05 };
const nutritionPerGram: NutritionalInfoData = { perGram: perGramMacros };

// ---------------------------------------------------------------------------
// findMeasure
// ---------------------------------------------------------------------------
describe('findMeasure', () => {
    const each = measure(mockEach, 110);
    const eachLarge = measure(mockEach, 150, { size: large });
    const cupChopped = measure(mockCup, 160, { prepMethod: chopped });
    const cup = measure(mockCup, 125);
    const measures = [each, eachLarge, cupChopped, cup];

    it('prefers the exact (unit, size, prep) row', () => {
        const key = { unit: mockCup, sizeId: null, prepMethodId: mockChopped._id };
        expect(findMeasure(measures, key)?.measure).toBe(cupChopped);
    });

    it('drops the prep method when no row has it', () => {
        const key = { unit: mockEach, sizeId: mockLarge._id, prepMethodId: mockChopped._id };
        expect(findMeasure(measures, key)?.measure).toBe(eachLarge);
    });

    it('drops the size when no row has it', () => {
        const key = { unit: mockEach, sizeId: 'unknown-size', prepMethodId: null };
        expect(findMeasure(measures, key)?.measure).toBe(each);
    });

    it('rescales the least specific volume row for another volume unit', () => {
        // 125 g per cup is 0.5283 g/ml, so a teaspoon weighs 125 / 48 g.
        const key = { unit: mockTeaspoon, sizeId: null, prepMethodId: null };
        const found = findMeasure(measures, key);
        expect(found?.measure).toBe(cup);
        expect(found?.gramsPerUnit).toBeCloseTo(125 / 48, 6);
    });

    it('prefers an exact unit match over rescaling', () => {
        const cupRow = measure(mockCup, 1);
        const key = { unit: mockMilliliter, sizeId: null, prepMethodId: null };
        expect(findMeasure([measure(mockMilliliter, 0.9), cupRow], key)?.gramsPerUnit).toBe(0.9);
    });

    it('never rescales between count units', () => {
        const clove = { ...mockEach, _id: 'clove', hidden: false, longSingular: 'clove' };
        expect(findMeasure([each], { unit: clove, sizeId: null, prepMethodId: null })).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// grams
// ---------------------------------------------------------------------------
describe('grams', () => {
    const labels = { ingredientName: 'honey' };
    const none = { sizeId: null, prepMethodId: null };

    it('converts a mass unit by its size alone', () => {
        expect(grams(2, { unit: mockKilogram, ...none }, [], labels)).toEqual({ grams: 2000 });
        expect(grams(1, { unit: mockOunce, ...none }, [], labels).grams).toBeCloseTo(28.3495, 4);
    });

    it('converts a volume unit through a volume measure', () => {
        const result = grams(
            1,
            { unit: mockCup, ...none },
            [measure(mockMilliliter, 1.42)],
            labels
        );
        expect(result.grams).toBeCloseTo(236.5882365 * 1.42, 6);
    });

    it('converts a count unit through its measure', () => {
        expect(grams(3, { unit: mockEach, ...none }, [measure(mockEach, 110)], labels)).toEqual({
            grams: 330,
        });
    });

    it('names the record to add when no measure matches', () => {
        expect(grams(1, { unit: mockCup, ...none }, [], labels)).toEqual({
            grams: null,
            reason: 'No weight recorded for 1 cup of honey',
        });
        expect(grams(1, { unit: mockEach, ...none }, [], { ...labels, sizeName: 'large' })).toEqual(
            {
                grams: null,
                reason: 'No weight recorded for 1 large honey',
            }
        );
    });
});

// ---------------------------------------------------------------------------
// calculateIngredientNutrition
// ---------------------------------------------------------------------------
describe('calculateIngredientNutrition', () => {
    it('returns not-calculable when quantity is missing', () => {
        const result = calculateIngredientNutrition(
            makeIngredient({ quantity: null }),
            nutritionPerGram,
            []
        );
        expect(result).toMatchObject({ calculable: false, reason: 'No quantity' });
    });

    it('returns not-calculable when quantity cannot be parsed (NaN guard)', () => {
        const result = calculateIngredientNutrition(
            makeIngredient({ quantity: 'abc' }),
            nutritionPerGram,
            []
        );
        expect(result).toMatchObject({ calculable: false, reason: 'Could not parse quantity' });
    });

    it('returns not-calculable when nutritional info is null', () => {
        const result = calculateIngredientNutrition(makeIngredient(), null, []);
        expect(result).toMatchObject({ calculable: false, reason: 'No nutritional data' });
    });

    it('prices a counted ingredient through its item weight', () => {
        const result = calculateIngredientNutrition(makeIngredient(), nutritionPerGram, [
            measure(mockEach, 110),
        ]);
        expect(result.calculable).toBe(true);
        expect(result.macros.calories).toBeCloseTo(880);
    });

    it('prices a sized line through the sized measure', () => {
        const result = calculateIngredientNutrition(
            makeIngredient({ quantity: '1', size: large } as Partial<RecipeIngredientView>),
            nutritionPerGram,
            [measure(mockEach, 110), measure(mockEach, 150, { size: large })]
        );
        expect(result.macros.calories).toBeCloseTo(600);
    });

    it('prices a mass unit with no measures at all', () => {
        const result = calculateIngredientNutrition(
            makeIngredient({ quantity: '250', unit: mockGram }),
            nutritionPerGram,
            []
        );
        expect(result.macros.calories).toBeCloseTo(1000);
    });

    it('marks a line with no matching measure as fixable', () => {
        const result = calculateIngredientNutrition(
            makeIngredient({ quantity: '1', unit: mockCup }),
            nutritionPerGram,
            []
        );
        expect(result).toMatchObject({
            calculable: false,
            reason: 'No weight recorded for 1 cup of onion',
            missingMeasure: true,
        });
    });
});

// ---------------------------------------------------------------------------
// sumRecipeNutrition
// ---------------------------------------------------------------------------
describe('sumRecipeNutrition', () => {
    const subsection = {
        __typename: 'IngredientSubsection',
        name: null,
        ingredients: [
            makeIngredient({ _id: 'ri-1', quantity: '1' }),
            makeIngredient({ _id: 'ri-2', quantity: '1', unit: mockCup }),
            makeIngredient({ _id: 'ri-3', quantity: '100', unit: mockGram }),
        ],
    } as unknown as IngredientSubsectionView;

    it('sums counted lines and lists uncounted ones with their reasons', () => {
        const result = sumRecipeNutrition(
            [subsection],
            new Map([['ing-1', nutritionPerGram]]),
            new Map([['ing-1', [measure(mockEach, 110)]]]),
            2
        );
        // (110 g + 100 g) × 4 kcal/g = 840 kcal, over 2 servings
        expect(result.total.calories).toBeCloseTo(840);
        expect(result.perServing.calories).toBeCloseTo(420);
        expect([...result.uncountedIds]).toEqual(['ri-2']);
        expect(result.uncounted[0]).toMatchObject({
            reason: 'No weight recorded for 1 cup of onion',
            missingMeasure: true,
        });
    });

    it('uses one serving when the serving count is not positive', () => {
        const result = sumRecipeNutrition(
            [subsection],
            new Map([['ing-1', nutritionPerGram]]),
            new Map([['ing-1', [measure(mockEach, 110)]]]),
            0
        );
        expect(result.perServing.calories).toBeCloseTo(840);
    });
});
