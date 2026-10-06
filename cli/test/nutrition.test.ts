import { expect } from 'chai';

import { nutritionStatus } from '../src/lib/nutrition.js';
import type { RecipeIngredientSummary } from '../src/lib/types.js';
import { findMeasure, suggestFromPortion } from '../src/lib/measures.js';
import type { MeasureSummary, NutritionalInfoSummary } from '../src/lib/types.js';
import { CUP, EACH, EGG, GARLIC, GRAM, LARGE, MILLILITRE, TEASPOON } from './helpers/fixtures.js';

const ingredient = {
    __typename: 'Ingredient' as const,
    _id: 'ing-1',
    name: 'milk',
    pluralName: 'milks',
    isCountable: false,
};

const perGram = { calories: 1, protein: 1, carbs: 1, fat: 1 };

function entry(overrides: Partial<RecipeIngredientSummary> = {}): RecipeIngredientSummary {
    return { quantity: '1', unit: EACH, ingredient, ...overrides } as RecipeIngredientSummary;
}

function info(overrides: Partial<NutritionalInfoSummary> = {}): NutritionalInfoSummary {
    return { _id: 'n1', ingredient: 'ing-1', perGram, ...overrides } as NutritionalInfoSummary;
}

function measure(unit: MeasureSummary['unit'], grams: number, extra = {}): MeasureSummary {
    return { _id: `m-${unit._id}`, ingredient: 'ing-1', unit, grams, ...extra };
}

describe('nutrition state, in the words the web UI uses', () => {
    it('reports missing when there is no record', () => {
        expect(nutritionStatus(entry(), null)).to.deep.equal({
            state: 'missing',
            reason: 'No nutritional data',
        });
    });

    it('reports a sub-recipe as not linkable', () => {
        const subRecipe = entry({
            ingredient: { __typename: 'Recipe', _id: 'r1', title: 'Stock' },
        });
        expect(nutritionStatus(subRecipe, null).state).to.equal('recipe');
    });

    it('prices a mass unit with no measure', () => {
        expect(nutritionStatus(entry({ unit: GRAM }), info()).state).to.equal('linked');
    });

    it('names the weight to record for a count or volume line', () => {
        expect(nutritionStatus(entry(), info())).to.deep.equal({
            state: 'partial',
            reason: 'No weight recorded for 1 milk',
            missingWeight: '1 milk',
        });
        expect(nutritionStatus(entry({ unit: CUP }), info()).reason).to.equal(
            'No weight recorded for 1 cup of milk'
        );
    });

    it('is calculable once a measure covers the line', () => {
        expect(nutritionStatus(entry(), info(), [measure(EACH, 240)]).state).to.equal('linked');
        // A volume row is a density, so it prices every volume unit.
        expect(
            nutritionStatus(entry({ unit: TEASPOON }), info(), [measure(MILLILITRE, 1.03)]).state
        ).to.equal('linked');
    });

    it('reports a missing quantity as partial when a record exists', () => {
        expect(nutritionStatus(entry({ quantity: null }), info())).to.deep.equal({
            state: 'partial',
            reason: 'No quantity',
        });
    });

    it('keeps state missing for a missing quantity when no record exists', () => {
        expect(nutritionStatus(entry({ quantity: null }), null)).to.deep.equal({
            state: 'missing',
            reason: 'No quantity',
        });
    });
});

describe('findMeasure', () => {
    it('prefers a sized row and falls back to the plain one', () => {
        const plain = measure(EACH, 50);
        const large = { ...measure(EACH, 63), _id: 'm-large', size: LARGE };
        const key = { unit: EACH, prepMethodId: null };
        expect(findMeasure([plain, large], { ...key, sizeId: LARGE._id })?.measure).to.equal(large);
        expect(findMeasure([plain, large], { ...key, sizeId: null })?.measure).to.equal(plain);
    });

    it('rescales a volume row by unit size', () => {
        const found = findMeasure([measure(CUP, 216)], {
            unit: TEASPOON,
            sizeId: null,
            prepMethodId: null,
        });
        expect(found?.gramsPerUnit).to.be.closeTo(216 / 48, 1e-9);
    });
});

describe('suggestFromPortion', () => {
    const units = [EACH, CUP, TEASPOON, GRAM, MILLILITRE];
    const sizes = [LARGE];

    it('maps "1 large" to each + size large', () => {
        expect(suggestFromPortion(EGG.portions![0], units, sizes, [])?.draft).to.deep.equal({
            unitId: EACH._id,
            sizeId: LARGE._id,
            prepMethodId: null,
            grams: 50,
        });
    });

    it('explains a portion that cannot become a row', () => {
        expect(suggestFromPortion(EGG.portions![1], units, sizes, [])?.reason).to.equal(
            'no matching unit or size "extra large"'
        );
        expect(suggestFromPortion(EGG.portions![5], units, sizes, [])?.reason).to.equal(
            'qualified portion, enter it by hand'
        );
        expect(suggestFromPortion(GARLIC.portions![0], units, sizes, [])?.reason).to.equal(
            'a serving size, not one unit'
        );
    });
});
