import { assert } from 'chai';
import { Types } from 'mongoose';
import { describe, it } from 'mocha';

import { perGramFor } from '../../src/utils/nutrition.js';
import { gramsPerUnit, quantityToFloat, yieldFraction } from '../../src/utils/nutrition.js';
import { MAX_DEPTH, NutritionData, UnitData, calculate } from '../../src/utils/nutrition.js';

function unit(id: string, dimension: UnitData['dimension'], perCanonical: number, extra = {}) {
    return { _id: id, longSingular: id, dimension, perCanonical, hidden: false, ...extra };
}
const GRAM = unit('gram', 'mass', 1);
const KILOGRAM = unit('kilogram', 'mass', 1000);
const TEASPOON = unit('teaspoon', 'volume', 4.92892159375);
const TABLESPOON = unit('tablespoon', 'volume', 14.78676478125);
const CUP = unit('cup', 'volume', 236.5882365);
const EACH = unit('each', 'count', 1, { hidden: true });
const CLOVE = unit('clove', 'count', 1);

describe('quantityToFloat', function () {
    it('reads whole numbers, decimals, fractions and mixed numbers', function () {
        assert.equal(quantityToFloat('2'), 2);
        assert.equal(quantityToFloat('1.5'), 1.5);
        assert.equal(quantityToFloat('3/2'), 1.5);
        assert.equal(quantityToFloat('1 1/2'), 1.5);
    });

    it('takes the midpoint of a range', function () {
        assert.equal(quantityToFloat('10-12'), 11);
        assert.equal(quantityToFloat('1/2-1'), 0.75);
    });

    it('gives NaN for anything else', function () {
        assert.isNaN(quantityToFloat('a lot'));
        assert.isNaN(quantityToFloat('1-2-3'));
    });
});

describe('gramsPerUnit', function () {
    const measures = [
        { unit: CUP, size: null, prepMethod: null, grams: 240 },
        { unit: EACH, size: 'large', prepMethod: null, grams: 150 },
        { unit: EACH, size: null, prepMethod: null, grams: 110 },
    ];

    it('prefers the sized row, and falls back to the plain one', function () {
        assert.equal(
            gramsPerUnit(measures, { unit: EACH, sizeId: 'large', prepMethodId: null }),
            150
        );
        assert.equal(
            gramsPerUnit(measures, { unit: EACH, sizeId: 'small', prepMethodId: null }),
            110
        );
    });

    it('rescales a volume row to another volume unit', function () {
        const grams = gramsPerUnit(measures, {
            unit: TABLESPOON,
            sizeId: null,
            prepMethodId: null,
        });
        assert.closeTo(grams!, 15, 0.01);
    });

    it('never rescales between count units', function () {
        assert.isNull(gramsPerUnit(measures, { unit: CLOVE, sizeId: null, prepMethodId: null }));
    });
});

describe('yieldFraction', function () {
    // The table in issue #116.
    const pizzaDough = [
        { quantity: 2, unit: EACH },
        { quantity: 900, unit: GRAM },
    ];
    const curryPaste = [
        { quantity: 1, unit: CUP },
        { quantity: 260, unit: GRAM },
    ];

    it('reads a count quantity against the count row', function () {
        assert.equal(yieldFraction(1, EACH, pizzaDough), 0.5);
    });

    it('reads a count quantity against the row in its own unit', function () {
        const garlic = [
            { quantity: 2, unit: EACH },
            { quantity: 20, unit: CLOVE },
        ];
        assert.equal(yieldFraction(1, EACH, garlic), 0.5);
        assert.equal(yieldFraction(5, CLOVE, garlic), 0.25);
    });

    it('reads a mass quantity against the mass row', function () {
        assert.closeTo(yieldFraction(300, GRAM, pizzaDough)!, 1 / 3, 1e-9);
        assert.closeTo(yieldFraction(0.3, KILOGRAM, pizzaDough)!, 1 / 3, 1e-9);
        assert.closeTo(yieldFraction(200, GRAM, curryPaste)!, 200 / 260, 1e-9);
    });

    it('reads a volume quantity against the volume row, in canonical units', function () {
        assert.closeTo(yieldFraction(2, TABLESPOON, curryPaste)!, 1 / 8, 1e-3);
    });

    it('reads any unit of the dimension against the row, in canonical units', function () {
        const ragu = [
            { quantity: 4, unit: CUP },
            { quantity: 1000, unit: GRAM },
        ];
        // A volume row in the quantity's own dimension is used directly.
        assert.closeTo(yieldFraction(1, CUP, ragu)!, 0.25, 1e-9);
        // Teaspoons against a cup row, in canonical millilitres:
        const massAndVolume = [
            { quantity: 500, unit: GRAM },
            { quantity: 2, unit: CUP },
        ];
        assert.closeTo(
            yieldFraction(1, TEASPOON, massAndVolume)!,
            TEASPOON.perCanonical / (2 * CUP.perCanonical),
            1e-9
        );
    });

    it('gives null when no row measures the quantity', function () {
        assert.isNull(yieldFraction(1, EACH, curryPaste), 'no count row');
        assert.isNull(yieldFraction(1, CLOVE, pizzaDough), 'a count row in another unit');
        assert.isNull(yieldFraction(200, GRAM, []), 'no yield');
        assert.isNull(yieldFraction(1, CUP, [{ quantity: 900, unit: GRAM }]), 'no density');
    });
});

describe('perGramFor', function () {
    const lime = { calories: 0.3, protein: 0.007, carbs: 0.106, fat: 0.002 };
    const juice = { calories: 0.25, protein: 0.004, carbs: 0.084, fat: 0.001 };
    const records = new Map([
        ['', lime],
        ['juiced', juice],
    ]);

    it('uses the record for the prep method', function () {
        assert.equal(perGramFor(records, 'juiced'), juice);
    });

    it('falls back to the record with no prep method', function () {
        assert.equal(perGramFor(records, 'sliced'), lime);
        assert.equal(perGramFor(records, null), lime);
    });

    it('never uses the record of another prep method', function () {
        const juiceOnly = new Map([['juiced', juice]]);
        assert.isUndefined(perGramFor(juiceOnly, null));
        assert.isUndefined(perGramFor(juiceOnly, 'sliced'));
        assert.isUndefined(perGramFor(undefined, 'juiced'));
    });
});

describe('calculate', function () {
    const id = () => new Types.ObjectId();
    const perGram = { calories: 2, protein: 0.1, carbs: 0.2, fat: 0.05 };

    /** A tree: salad uses 300 g of couscous, which uses 100 g of flour and 1 pot of stock. */
    function data(overrides: Partial<NutritionData> = {}): NutritionData {
        return {
            recipes: new Map([
                [
                    'salad',
                    {
                        _id: 'salad',
                        title: 'Salad',
                        yields: [],
                        ingredients: [
                            {
                                _id: id(),
                                type: 'recipe',
                                quantity: '300',
                                unit: 'gram',
                                size: null,
                                prepMethod: null,
                                ingredient: 'couscous',
                            },
                            {
                                _id: id(),
                                type: 'ingredient',
                                quantity: null,
                                unit: null,
                                size: null,
                                prepMethod: null,
                                ingredient: 'salt',
                            },
                        ],
                    },
                ],
                [
                    'couscous',
                    {
                        _id: 'couscous',
                        title: 'Pearl Couscous',
                        yields: [{ quantity: '600', unit: 'gram' }],
                        ingredients: [
                            {
                                _id: id(),
                                type: 'ingredient',
                                quantity: '100',
                                unit: 'gram',
                                size: null,
                                prepMethod: null,
                                ingredient: 'flour',
                            },
                            {
                                _id: id(),
                                type: 'ingredient',
                                quantity: '1',
                                unit: 'each',
                                size: null,
                                prepMethod: null,
                                ingredient: 'stock',
                            },
                        ],
                    },
                ],
            ]),
            perGram: new Map([
                ['flour', new Map([['', perGram]])],
                ['stock', new Map([['', perGram]])],
            ]),
            measures: new Map([
                ['stock', [{ unit: EACH, size: null, prepMethod: null, grams: 26 }]],
            ]),
            ingredientNames: new Map([
                ['flour', 'flour'],
                ['stock', 'stock pot'],
                ['salt', 'salt'],
            ]),
            units: new Map<string, UnitData>([
                ['gram', GRAM],
                ['each', EACH],
            ]),
            sizeNames: new Map(),
            ...overrides,
        };
    }

    it('adds a share of a child recipe, through its yield', function () {
        const result = calculate('salad', data());
        const [couscous, salt] = result.ingredients;
        assert.equal(couscous.status, 'COUNTED');
        // Couscous: (100 + 26) g × 2 kcal = 252 kcal per 600 g recipe; half of it is used.
        assert.closeTo(couscous.macros.calories, 126, 1e-9);
        assert.equal(couscous.childRecipe, 'couscous');
        assert.equal(salt.status, 'UNCOUNTED');
        assert.deepEqual(salt.reason, { code: 'NO_QUANTITY', message: 'No quantity' });
        assert.closeTo(result.total.calories, 126, 1e-9);
    });

    it('marks a child with uncounted ingredients as partial, and still adds what it has', function () {
        const partial = data({ measures: new Map() });
        const [couscous] = calculate('salad', partial).ingredients;
        assert.equal(couscous.status, 'PARTIAL');
        assert.equal(couscous.childUncounted, 1);
        assert.equal(couscous.reason?.code, 'CHILD_PARTIAL');
        assert.equal(couscous.reason?.message, '1 of 2 ingredients in Pearl Couscous not counted');
        // Only the flour: 200 kcal per recipe, half used.
        assert.closeTo(couscous.macros.calories, 100, 1e-9);
    });

    it('names the missing weight of an ingredient', function () {
        const result = calculate('couscous', data({ measures: new Map() }));
        assert.deepEqual(result.ingredients[1].reason, {
            code: 'NO_MEASURE',
            message: 'No weight recorded for 1 stock pot',
        });
    });

    it('weighs a prep method record only by measures with that prep method', function () {
        const juiced = data({
            perGram: new Map([['stock', new Map([['juiced', perGram]])]]),
        });
        juiced.recipes.get('couscous')!.ingredients[1].prepMethod = 'juiced';
        assert.equal(calculate('couscous', juiced).ingredients[1].reason?.code, 'NO_MEASURE');
        juiced.measures.set('stock', [
            { unit: EACH, size: null, prepMethod: null, grams: 26 },
            { unit: EACH, size: null, prepMethod: 'juiced', grams: 13 },
        ]);
        const [, stock] = calculate('couscous', juiced).ingredients;
        assert.closeTo(stock.macros.calories, 26, 1e-9);
    });

    it('weighs a sized line with a prep method record by the unsized prep measure', function () {
        const juiced = data({
            perGram: new Map([['stock', new Map([['juiced', perGram]])]]),
            measures: new Map([
                [
                    'stock',
                    [
                        { unit: EACH, size: null, prepMethod: null, grams: 26 },
                        { unit: EACH, size: null, prepMethod: 'juiced', grams: 13 },
                    ],
                ],
            ]),
        });
        Object.assign(juiced.recipes.get('couscous')!.ingredients[1], {
            prepMethod: 'juiced',
            size: 'large',
        });
        const [, stock] = calculate('couscous', juiced).ingredients;
        assert.equal(stock.status, 'COUNTED');
        assert.closeTo(stock.macros.calories, 26, 1e-9);
    });

    it('leaves a recipe used as an ingredient uncounted when it has no yield in the dimension', function () {
        const noYield = data();
        noYield.recipes.get('couscous')!.yields = [];
        assert.deepEqual(calculate('salad', noYield).ingredients[0].reason, {
            code: 'NO_YIELD',
            message: 'No yield recorded for Pearl Couscous',
        });
        const countOnly = data();
        countOnly.recipes.get('couscous')!.yields = [{ quantity: '2', unit: 'each' }];
        assert.deepEqual(calculate('salad', countOnly).ingredients[0].reason, {
            code: 'NO_YIELD',
            message: 'No yield in mass recorded for Pearl Couscous',
        });
    });

    it('stops at a cycle already in the data, instead of never ending', function () {
        const cyclic = data();
        cyclic.recipes.get('couscous')!.ingredients.push({
            _id: id(),
            type: 'recipe',
            quantity: '1',
            unit: 'gram',
            size: null,
            prepMethod: null,
            ingredient: 'salad',
        });
        cyclic.recipes.get('salad')!.yields = [{ quantity: '100', unit: 'gram' }];
        const couscous = calculate('couscous', cyclic);
        const salad = couscous.ingredients[2];
        // Couscous uses salad, and salad's own couscous is the cycle.
        assert.equal(salad.status, 'PARTIAL');
        const inner = calculate('salad', cyclic, ['couscous']).ingredients[0];
        assert.equal(inner.reason?.code, 'CYCLE');
    });

    it('stops at the depth limit', function () {
        const deep = data();
        const stack = Array.from({ length: MAX_DEPTH }, (_, i) => `r${i}`);
        deep.recipes.get('salad')!.ingredients[0].ingredient = 'not-loaded';
        const [result] = calculate('salad', deep, stack.slice(0, MAX_DEPTH - 1)).ingredients;
        assert.equal(result.reason?.code, 'DEPTH_LIMIT');
    });
});
