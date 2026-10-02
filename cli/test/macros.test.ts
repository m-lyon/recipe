import { expect } from 'chai';

import { EGG, OLIVE_OIL } from './helpers/fixtures.js';
import { missingMacros, perGramFrom, scaleMacros } from '../src/lib/macros.js';

describe('macro arithmetic', () => {
    it('divides the per-100 g values by 100', () => {
        expect(perGramFrom(OLIVE_OIL)).to.deep.equal({
            calories: 8.84,
            protein: 0,
            carbs: 0,
            fat: 1,
        });
    });

    it('multiplies perGram by the chosen portion gram weight', () => {
        const perUnit = scaleMacros(perGramFrom(EGG), 50);
        expect(perUnit).to.deep.equal({
            calories: 71.5,
            protein: 6.28,
            carbs: 0.36,
            fat: 4.755,
        });
    });

    it('names the macros a record does not carry', () => {
        expect(missingMacros({ ...EGG, proteinPer100g: null })).to.deep.equal(['protein']);
        expect(missingMacros(EGG)).to.deep.equal([]);
    });
});
