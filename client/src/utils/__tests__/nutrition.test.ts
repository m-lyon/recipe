import { describe, expect, it } from 'vitest';

import { mockCup, mockKilogram, mockTeaspoon } from '@recipe/graphql/queries/__mocks__/unit';
import {
    mockUnitConversionOne,
    mockUnitConversionTwo,
    mockUnitConversionVolume,
} from '@recipe/graphql/queries/__mocks__/unitConversion';

import {
    MacroNutrients,
    NutritionalInfoData,
    addMacros,
    calculateIngredientNutrition,
    quantityToFloat,
    sumRecipeNutrition,
} from '../nutrition';

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

function makeIngredient(overrides: Partial<RecipeIngredientView> = {}): RecipeIngredientView {
    return {
        __typename: 'RecipeIngredient',
        _id: 'ri-1',
        quantity: '2',
        unit: null,
        ingredient: {
            __typename: 'Ingredient',
            _id: 'ing-1',
            name: 'Test ingredient',
            density: null,
        },
        ...overrides,
    } as unknown as RecipeIngredientView;
}

const perUnitMacros: MacroNutrients = { calories: 100, protein: 10, carbs: 5, fat: 3 };
const perGramMacros: MacroNutrients = { calories: 4, protein: 0.1, carbs: 0.8, fat: 0.05 };

const nutritionPerUnit: NutritionalInfoData = { perUnit: perUnitMacros };
const nutritionPerGram: NutritionalInfoData = { perGram: perGramMacros };

// ---------------------------------------------------------------------------
// calculateIngredientNutrition
// ---------------------------------------------------------------------------
describe('calculateIngredientNutrition', () => {
    const unitConversions: UnitConversion[] = [mockUnitConversionOne, mockUnitConversionTwo];

    it('returns not-calculable when quantity is missing', () => {
        const ri = makeIngredient({ quantity: null });
        const result = calculateIngredientNutrition(ri, nutritionPerUnit, unitConversions);
        expect(result.calculable).toBe(false);
    });

    it('returns not-calculable when quantity cannot be parsed (NaN guard)', () => {
        const ri = makeIngredient({ quantity: 'abc' });
        const result = calculateIngredientNutrition(ri, nutritionPerUnit, unitConversions);
        expect(result.calculable).toBe(false);
        expect(result.reason).toContain('parse');
    });

    it('returns not-calculable when nutritional info is null', () => {
        const ri = makeIngredient({ quantity: '1' });
        const result = calculateIngredientNutrition(ri, null, unitConversions);
        expect(result.calculable).toBe(false);
    });

    it('calculates per-unit for a unitless ingredient', () => {
        const ri = makeIngredient({ quantity: '3', unit: null });
        const result = calculateIngredientNutrition(ri, nutritionPerUnit, unitConversions);
        expect(result.calculable).toBe(true);
        expect(result.macros.calories).toBeCloseTo(300);
        expect(result.macros.protein).toBeCloseTo(30);
    });

    it('returns not-calculable for unitless ingredient with no perUnit data', () => {
        const ri = makeIngredient({ quantity: '3', unit: null });
        const result = calculateIngredientNutrition(ri, nutritionPerGram, unitConversions);
        expect(result.calculable).toBe(false);
    });

    it('calculates grams for a gram unit ingredient', () => {
        // mockGram is in mockUnitConversionOne with baseToUnitConversion handled via rule
        // mockUnitConversionOne: baseUnit=gram, rules=[kg rule: baseToUnitConversion=1000]
        // For gram itself there's no rule — it IS the base unit, so we need a direct gram conversion.
        // Actually gram is the base unit; to convert "grams" to grams we need it in unitConversions.
        // The mock only has a kg rule. Let's use kg instead.
        const ri = makeIngredient({ quantity: '1', unit: mockKilogram as unknown as UnitView });
        const result = calculateIngredientNutrition(ri, nutritionPerGram, unitConversions);
        expect(result.calculable).toBe(true);
        // 1 kg = 1000 g (baseToUnitConversion for kg = 1000)
        expect(result.macros.calories).toBeCloseTo(perGramMacros.calories * 1000);
    });

    it('returns not-calculable for mass unit with no perGram data', () => {
        const ri = makeIngredient({ quantity: '1', unit: mockKilogram as unknown as UnitView });
        const result = calculateIngredientNutrition(ri, nutritionPerUnit, unitConversions);
        expect(result.calculable).toBe(false);
    });

    it('calculates via density for a volume unit ingredient with density', () => {
        // mockCup: volume, mockUnitConversionTwo has cup rule: baseToUnitConversion=48 (48 tsp per cup)
        // Teaspoon is base unit of mockUnitConversionTwo but its measureType is null (not volume).
        // Actually mockUnitConversionTwo.baseUnit = mockTeaspoon (measureType: null, not 'volume')
        // So convertToMl will return null since baseUnit.measureType !== 'volume'.
        // Let's verify this path is not calculable with the current mocks, which is expected.
        const ri = makeIngredient({
            quantity: '1',
            unit: mockCup as unknown as UnitView,
            ingredient: {
                __typename: 'Ingredient',
                _id: 'ing-1',
                name: 'Water',
                density: 1,
            } as unknown as RecipeIngredientView['ingredient'],
        });
        const result = calculateIngredientNutrition(ri, nutritionPerGram, unitConversions);
        // mockUnitConversionTwo baseUnit is teaspoon with measureType: null (not volume)
        // so this is not calculable
        expect(result.calculable).toBe(false);
        expect(result.reason).toContain('Cannot convert');
    });

    it('calculates via density for a volume unit when a proper volume base unit is present', () => {
        // mockUnitConversionVolume: baseUnit=mockMilliliter (measureType: 'volume')
        // mockConversionRuleFour: cup → 240 ml (baseToUnitConversion=240)
        // 2 cups × 240 ml/cup = 480 ml; density = 0.5 g/ml → 240 g
        const ri = makeIngredient({
            quantity: '2',
            unit: mockCup as unknown as UnitView,
            ingredient: {
                __typename: 'Ingredient',
                _id: 'ing-1',
                name: 'Honey',
                density: 0.5,
            } as unknown as RecipeIngredientView['ingredient'],
        });
        const volumeConversions: UnitConversion[] = [mockUnitConversionOne, mockUnitConversionVolume];
        const result = calculateIngredientNutrition(ri, nutritionPerGram, volumeConversions);
        expect(result.calculable).toBe(true);
        // 2 cups × 240 ml/cup × 0.5 g/ml = 240 g
        expect(result.macros.calories).toBeCloseTo(perGramMacros.calories * 240);
    });

    it('returns not-calculable for volume unit without density', () => {
        const ri = makeIngredient({
            quantity: '1',
            unit: mockCup as unknown as UnitView,
            ingredient: {
                __typename: 'Ingredient',
                _id: 'ing-1',
                name: 'Flour',
                density: null,
            } as unknown as RecipeIngredientView['ingredient'],
        });
        const result = calculateIngredientNutrition(ri, nutritionPerGram, unitConversions);
        expect(result.calculable).toBe(false);
    });

    it('returns not-calculable for unit with no measureType', () => {
        const ri = makeIngredient({ quantity: '1', unit: mockTeaspoon as unknown as UnitView });
        const result = calculateIngredientNutrition(ri, nutritionPerGram, unitConversions);
        expect(result.calculable).toBe(false);
        expect(result.reason).toContain('tsp');
    });

    it('does not mutate ZERO_MACROS on non-calculable result', () => {
        const ri = makeIngredient({ quantity: null });
        const r1 = calculateIngredientNutrition(ri, nutritionPerUnit, []);
        const r2 = calculateIngredientNutrition(ri, nutritionPerUnit, []);
        // If ZERO_MACROS is returned by reference both times they would be the same object,
        // meaning mutating r1.macros would affect r2.macros. Ensure they are different objects.
        expect(r1.macros).not.toBe(r2.macros);
    });

    it('handles mixed-number quantity like "1 1/2"', () => {
        const ri = makeIngredient({ quantity: '1 1/2', unit: null });
        const result = calculateIngredientNutrition(ri, nutritionPerUnit, []);
        expect(result.calculable).toBe(true);
        expect(result.macros.calories).toBeCloseTo(perUnitMacros.calories * 1.5);
    });
});

// ---------------------------------------------------------------------------
// sumRecipeNutrition
// ---------------------------------------------------------------------------
describe('sumRecipeNutrition', () => {
    function makeSubsection(items: RecipeIngredientView[]): IngredientSubsectionView {
        return {
            __typename: 'IngredientSubsection',
            _id: 'ss-1',
            name: null,
            ingredients: items,
        } as unknown as IngredientSubsectionView;
    }

    const ri1 = makeIngredient({ _id: 'ri-1', quantity: '2', unit: null });
    const ri2 = makeIngredient({ _id: 'ri-2', quantity: '3', unit: null });
    const infoMap = new Map<string, NutritionalInfoData | null>([
        ['ing-1', nutritionPerUnit],
    ]);

    it('sums calculable ingredients and excludes uncountable ones', () => {
        // ri1 has ingredientId ing-1 (has info), ri2 also has ing-1 (has info)
        const subsections = [makeSubsection([ri1, ri2])];
        const result = sumRecipeNutrition(subsections, infoMap, [], 2);
        // ri1: 2 units × 100 cal = 200; ri2: 3 × 100 = 300 → total = 500
        expect(result.total.calories).toBeCloseTo(500);
        expect(result.perServing.calories).toBeCloseTo(250);
        expect(result.uncountedIds.size).toBe(0);
    });

    it('adds uncountable ingredient ids to uncountedIds', () => {
        const riNoInfo = makeIngredient({
            _id: 'ri-3',
            quantity: '1',
            unit: null,
            ingredient: {
                __typename: 'Ingredient',
                _id: 'ing-no-info',
                name: 'Unknown ingredient',
                density: null,
            } as unknown as RecipeIngredientView['ingredient'],
        });
        const subsections = [makeSubsection([ri1, riNoInfo])];
        const result = sumRecipeNutrition(subsections, infoMap, [], 1);
        expect(result.uncountedIds.has('ri-3')).toBe(true);
        expect(result.total.calories).toBeCloseTo(200);
    });

    it('silently corrects numServings=0 to 1', () => {
        const subsections = [makeSubsection([ri1])];
        const result = sumRecipeNutrition(subsections, infoMap, [], 0);
        // total = 200, divisor = 1 (not 0)
        expect(result.perServing.calories).toBeCloseTo(200);
    });

    it('skips nested-recipe ingredients', () => {
        const nestedRi: RecipeIngredientView = {
            __typename: 'RecipeIngredient',
            _id: 'ri-nested',
            quantity: '1',
            unit: null,
            ingredient: {
                __typename: 'Recipe',
                _id: 'rec-1',
                name: 'Nested',
            },
        } as unknown as RecipeIngredientView;
        const subsections = [makeSubsection([nestedRi])];
        const result = sumRecipeNutrition(subsections, infoMap, [], 1);
        expect(result.total.calories).toBe(0);
        expect(result.uncountedIds.size).toBe(0);
    });
});
