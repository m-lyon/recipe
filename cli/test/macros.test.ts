import { expect } from 'chai';

import { EGG, OLIVE_OIL } from './helpers/fixtures.js';
import { kcalMismatch, parseLabelPer100g } from '../src/lib/macros.js';
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

describe('label values', () => {
    it('reads kcal, protein, carbs and fat, in that order', () => {
        expect(parseLabelPer100g('69,3.8,12,0.5')).to.deep.equal({
            caloriesPer100g: 69,
            proteinPer100g: 3.8,
            carbsPer100g: 12,
            fatPer100g: 0.5,
        });
        expect(parseLabelPer100g(' 153, 4, 29, 2.5 ')?.carbsPer100g).to.equal(29);
    });

    it('refuses anything that is not four non-negative numbers', () => {
        for (const text of ['69,3.8,12', '69,3.8,12,0.5,1', '69,-1,12,0.5', '69,x,12,0.5', '']) {
            expect(parseLabelPer100g(text), text).to.equal(null);
        }
    });

    it('accepts kcal that the macros explain, as on a UK label with fibre', () => {
        // Engevita: 349 kcal, 47 g protein, 19 g carbs, 5 g fat, and 20 g fibre.
        expect(kcalMismatch(parseLabelPer100g('349,47,19,5')!)).to.equal(null);
    });

    it('names kcal that the macros do not explain, such as swapped values', () => {
        expect(kcalMismatch(parseLabelPer100g('69,12,3.8,50')!)).to.equal(
            '69 kcal does not match the macros (about 513 kcal)'
        );
    });
});
