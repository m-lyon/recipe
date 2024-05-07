import { describe, expect, it } from 'vitest';

import { VALID_NUMBER_REGEX } from '../number';

describe('VALID_NUMBER_REGEX', () => {
    it('should match valid numbers', () => {
        expect('1').toMatch(VALID_NUMBER_REGEX);
        expect('1.5').toMatch(VALID_NUMBER_REGEX);
        expect('1/2').toMatch(VALID_NUMBER_REGEX);
        expect('1.5-2').toMatch(VALID_NUMBER_REGEX);
        expect('1.5-2.5').toMatch(VALID_NUMBER_REGEX);
    });

    it('should not match invalid numbers', () => {
        expect('1/0').not.toMatch(VALID_NUMBER_REGEX);
        expect('1/2-1').not.toMatch(VALID_NUMBER_REGEX);
        expect('1.5-2/3').not.toMatch(VALID_NUMBER_REGEX);
        expect('1.5-2.5-3').not.toMatch(VALID_NUMBER_REGEX);
    });
});
