import { expect } from 'chai';

import { nutritionStatus } from '../src/lib/nutrition.js';
import type { NutritionalInfoSummary, RecipeIngredientSummary } from '../src/lib/types.js';

const ingredient = {
    __typename: 'Ingredient' as const,
    _id: 'ing-1',
    name: 'milk',
    pluralName: 'milks',
    isCountable: false,
    density: null as number | null,
};

const perGram = { calories: 1, protein: 1, carbs: 1, fat: 1 };

function entry(overrides: Partial<RecipeIngredientSummary> = {}): RecipeIngredientSummary {
    return { quantity: '1', ingredient, ...overrides } as RecipeIngredientSummary;
}

function info(overrides: Partial<NutritionalInfoSummary> = {}): NutritionalInfoSummary {
    return { _id: 'n1', ingredient: 'ing-1', perGram, ...overrides } as NutritionalInfoSummary;
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

    it('needs perUnit when the ingredient is used without a unit', () => {
        expect(nutritionStatus(entry(), info()).reason).to.equal('No per-unit nutritional data');
        expect(nutritionStatus(entry(), info({ perUnit: perGram })).state).to.equal('linked');
    });

    it('needs perGram for a mass unit', () => {
        const massEntry = entry({ unit: { _id: 'u', shortSingular: 'g', measureType: 'mass' } });
        expect(nutritionStatus(massEntry, info()).state).to.equal('linked');
        expect(nutritionStatus(massEntry, info({ perGram: null })).reason).to.equal(
            'No per-gram nutritional data'
        );
    });

    it('needs a density for a volume unit', () => {
        const volumeEntry = entry({
            unit: { _id: 'u', shortSingular: 'cup', measureType: 'volume' },
        });
        expect(nutritionStatus(volumeEntry, info()).reason).to.equal(
            'No density set for volume-measured ingredient'
        );
        const withDensity = entry({
            unit: { _id: 'u', shortSingular: 'cup', measureType: 'volume' },
            ingredient: { ...ingredient, density: 1.03 },
        });
        expect(nutritionStatus(withDensity, info()).state).to.equal('linked');
    });

    it('names a unit that has no measure type', () => {
        const noType = entry({ unit: { _id: 'u', shortSingular: 'pinch', measureType: null } });
        expect(nutritionStatus(noType, info()).reason).to.equal(
            'Unit "pinch" has no measure type set'
        );
    });

    it('reports a missing quantity', () => {
        expect(nutritionStatus(entry({ quantity: null }), info()).reason).to.equal('No quantity');
    });

    it('reports the missing quantity before the missing record, matching the web UI', () => {
        expect(nutritionStatus(entry({ quantity: null }), null).reason).to.equal('No quantity');
    });
});
