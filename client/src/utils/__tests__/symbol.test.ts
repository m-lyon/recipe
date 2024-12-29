import { describe, expect, it } from 'vitest';

import { replaceDegrees, replaceFractions } from '../symbol';

describe('replaceDegrees', () => {
    it('should replace " degrees F " with °F', () => {
        const input = '350 degrees F ';
        const result = replaceDegrees(input);
        expect(result).toEqual('350°F ');
    });
    it('should replace "degrees F " with °F', () => {
        const input = '350degrees F ';
        const result = replaceDegrees(input);
        expect(result).toEqual('350°F ');
    });
    it('should replace " degrees C " with °C', () => {
        const input = '350 degrees C ';
        const result = replaceDegrees(input);
        expect(result).toEqual('350°C ');
    });
    it('should replace "degrees C " with °C', () => {
        const input = '350degrees C ';
        const result = replaceDegrees(input);
        expect(result).toEqual('350°C ');
    });
    it('should replace " degrees f " with °F', () => {
        const input = '200 degrees f ';
        const result = replaceDegrees(input);
        expect(result).toEqual('200°F ');
    });
    it('should replace " degrees c " with °C', () => {
        const input = '350 degrees c ';
        const result = replaceDegrees(input);
        expect(result).toEqual('350°C ');
    });
    it('should replace " degrees c." with °C', () => {
        const input = '350 degrees c.';
        const result = replaceDegrees(input);
        expect(result).toEqual('350°C.');
    });
    it('should replace degrees F with °F in a sentence', () => {
        const input = 'Preheat oven to 350 degrees F ';
        const result = replaceDegrees(input);
        expect(result).toEqual('Preheat oven to 350°F ');
    });
    it('should replace degrees C with °C in a sentence', () => {
        const input = 'Preheat oven to 350 degrees C ';
        const result = replaceDegrees(input);
        expect(result).toEqual('Preheat oven to 350°C ');
    });
    it('should not replace degrees without a space after', () => {
        const input = '350 degrees C';
        const result = replaceDegrees(input);
        expect(result).toEqual('350 degrees C');
    });
});

describe('replaceFractions', () => {
    it('should replace "1/2 " with ½', () => {
        const input = '1/2 ';
        const result = replaceFractions(input);
        expect(result).toEqual('½ ');
    });
    it('should replace "1/4 " with ¼', () => {
        const input = '1/4 ';
        const result = replaceFractions(input);
        expect(result).toEqual('¼ ');
    });
    it('should replace "3/4 " with ¾', () => {
        const input = '3/4 ';
        const result = replaceFractions(input);
        expect(result).toEqual('¾ ');
    });
    it('should replace "1/2" with ½ in a sentence', () => {
        const input = 'Add 1/2 cup of sugar';
        const result = replaceFractions(input);
        expect(result).toEqual('Add ½ cup of sugar');
    });
    it('should replace "1/4" with ¼ in a sentence', () => {
        const input = 'Add 1/4 cup of sugar';
        const result = replaceFractions(input);
        expect(result).toEqual('Add ¼ cup of sugar');
    });
    it('should replace "3/4" with ¾ in a sentence', () => {
        const input = 'Add 3/4 cup of sugar';
        const result = replaceFractions(input);
        expect(result).toEqual('Add ¾ cup of sugar');
    });
    it('should not replace fractions without a space after', () => {
        const input = '1/2';
        const result = replaceFractions(input);
        expect(result).toEqual('1/2');
    });
});
