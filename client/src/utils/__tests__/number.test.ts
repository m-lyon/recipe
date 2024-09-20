import { describe, expect, it } from 'vitest';

import { VALID_NUMBER_REGEX, formatFraction } from '../number';

describe('VALID_NUMBER_REGEX', () => {
    it('should match valid numbers', () => {
        expect('1').toMatch(VALID_NUMBER_REGEX);
        expect('1.5').toMatch(VALID_NUMBER_REGEX);
        expect('1/2').toMatch(VALID_NUMBER_REGEX);
        expect('1.5-2').toMatch(VALID_NUMBER_REGEX);
        expect('1.5-2.5').toMatch(VALID_NUMBER_REGEX);
        expect('1/2-1').toMatch(VALID_NUMBER_REGEX);
        expect('1.5-2/3').toMatch(VALID_NUMBER_REGEX);
    });

    it('should not match invalid numbers', () => {
        expect('1/0').not.toMatch(VALID_NUMBER_REGEX);
        expect('1.5-2.5-3').not.toMatch(VALID_NUMBER_REGEX);
        expect('1.5-2.5-3/4').not.toMatch(VALID_NUMBER_REGEX);
    });
});

describe('formatFraction', () => {
    it('should format a fraction', () => {
        expect(formatFraction('1/2')).toBe('½');
        expect(formatFraction('3/4')).toBe('¾');
        expect(formatFraction('5/8')).toBe('⅝');
    });

    it('should format a top heavy fraction as a mixed number', () => {
        expect(formatFraction('3/2')).toBe('1½');
        expect(formatFraction('5/4')).toBe('1¼');
    });
});
