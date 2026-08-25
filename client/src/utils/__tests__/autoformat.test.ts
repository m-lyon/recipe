import { describe, expect, it } from 'vitest';

import { autoFormat } from '../autoformat';

describe('autoFormat degrees', () => {
    it('should replace " degrees F " with °F', () => {
        expect(autoFormat('350 degrees F ')).toEqual('350°F ');
    });
    it('should replace "degrees F " with °F', () => {
        expect(autoFormat('350degrees F ')).toEqual('350°F ');
    });
    it('should replace " degrees C " with °C', () => {
        expect(autoFormat('350 degrees C ')).toEqual('350°C ');
    });
    it('should replace "degrees C " with °C', () => {
        expect(autoFormat('350degrees C ')).toEqual('350°C ');
    });
    it('should replace " degrees f " with °F', () => {
        expect(autoFormat('200 degrees f ')).toEqual('200°F ');
    });
    it('should replace " degrees c " with °C', () => {
        expect(autoFormat('350 degrees c ')).toEqual('350°C ');
    });
    it('should replace " degrees c." with °C', () => {
        expect(autoFormat('350 degrees c.')).toEqual('350°C.');
    });
    it('should replace degrees F with °F in a sentence', () => {
        expect(autoFormat('Preheat oven to 350 degrees F ')).toEqual('Preheat oven to 350°F ');
    });
    it('should replace degrees C with °C in a sentence', () => {
        expect(autoFormat('Preheat oven to 350 degrees C ')).toEqual('Preheat oven to 350°C ');
    });
    it('should not replace degrees without a space after', () => {
        expect(autoFormat('350 degrees C')).toEqual('350 degrees C');
    });
});

describe('autoFormat fractions', () => {
    it('should replace "1/2 " with ½', () => {
        expect(autoFormat('1/2 ')).toEqual('½ ');
    });
    it('should replace "1/4 " with ¼', () => {
        expect(autoFormat('1/4 ')).toEqual('¼ ');
    });
    it('should replace "3/4 " with ¾', () => {
        expect(autoFormat('3/4 ')).toEqual('¾ ');
    });
    it('should replace "1/2" with ½ in a sentence', () => {
        expect(autoFormat('Add 1/2 cup of sugar')).toEqual('Add ½ cup of sugar');
    });
    it('should replace "1/4" with ¼ in a sentence', () => {
        expect(autoFormat('Add 1/4 cup of sugar')).toEqual('Add ¼ cup of sugar');
    });
    it('should replace "3/4" with ¾ in a sentence', () => {
        expect(autoFormat('Add 3/4 cup of sugar')).toEqual('Add ¾ cup of sugar');
    });
    it('should not replace fractions without a space after', () => {
        expect(autoFormat('1/2')).toEqual('1/2');
    });
});

describe('autoFormat accented words', () => {
    it('should replace "saute " with "sauté "', () => {
        expect(autoFormat('saute ')).toEqual('sauté ');
    });
    it('should replace conjugations "sauteed" and "sauteing"', () => {
        expect(autoFormat('sauteed ')).toEqual('sautéed ');
        expect(autoFormat('sauteing ')).toEqual('sautéing ');
    });
    it('should replace "saute" within a sentence', () => {
        expect(autoFormat('Saute the onions until soft ')).toEqual('Sauté the onions until soft ');
    });
    it('should preserve a leading capital', () => {
        expect(autoFormat('Saute ')).toEqual('Sauté ');
    });
    it('should replace other seeded words', () => {
        expect(autoFormat('puree ')).toEqual('purée ');
        expect(autoFormat('pureed ')).toEqual('puréed ');
        expect(autoFormat('flambe ')).toEqual('flambé ');
        expect(autoFormat('souffle ')).toEqual('soufflé ');
        expect(autoFormat('creme ')).toEqual('crème ');
        expect(autoFormat('brulee ')).toEqual('brûlée ');
        expect(autoFormat('jalapeno ')).toEqual('jalapeño ');
        expect(autoFormat('jalapenos ')).toEqual('jalapeños ');
    });
    it('should trigger on punctuation boundaries', () => {
        expect(autoFormat('saute, ')).toEqual('sauté, ');
        expect(autoFormat('saute.')).toEqual('sauté.');
    });
    it('should not replace a word without a following boundary', () => {
        expect(autoFormat('saute')).toEqual('saute');
    });
    it('should not replace a word while a longer form is being typed', () => {
        // "saute" is a prefix of "sauteing"; the boundary lookahead prevents an early match
        expect(autoFormat('sauteing')).toEqual('sauteing');
    });
    it('should not replace homographs of common English words', () => {
        expect(autoFormat('cafe ')).toEqual('cafe ');
        expect(autoFormat('pate ')).toEqual('pate ');
    });
    it('should not replace a word embedded in another word', () => {
        expect(autoFormat('sauteXYZ ')).toEqual('sauteXYZ ');
    });
});
