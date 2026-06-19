import { describe, expect, it } from 'vitest';

import { splitByKeyPhrases } from '../keyPhrase';

const kp = (value: string, description = `Description of ${value}`) => ({
    value,
    description,
});

describe('splitByKeyPhrases', () => {
    it('should return single segment when no key phrases provided', () => {
        const result = splitByKeyPhrases('Heat the oil in a pan.', []);
        expect(result).toEqual([{ text: 'Heat the oil in a pan.' }]);
    });

    it('should return three segments for a single match (before, match, after)', () => {
        const result = splitByKeyPhrases('Bring to a boil and simmer.', [kp('bring to a boil')]);
        expect(result).toEqual([
            { text: 'Bring to a boil', keyPhrase: kp('bring to a boil') },
            { text: ' and simmer.' },
        ]);
    });

    it('should match case-insensitively', () => {
        const result = splitByKeyPhrases('FOLD IN the cheese gently.', [kp('fold in')]);
        expect(result).toEqual([
            { text: 'FOLD IN', keyPhrase: kp('fold in') },
            { text: ' the cheese gently.' },
        ]);
    });

    it('should respect word boundaries — "salt" does NOT match inside "salty"', () => {
        const result = splitByKeyPhrases('Add salty butter and salt.', [kp('salt')]);
        expect(result).toEqual([
            { text: 'Add salty butter and ' },
            { text: 'salt', keyPhrase: kp('salt') },
            { text: '.' },
        ]);
    });

    it('should prefer longest match when phrases overlap', () => {
        const result = splitByKeyPhrases('Season to taste before serving.', [
            kp('season'),
            kp('season to taste'),
        ]);
        expect(result).toEqual([
            { text: 'Season to taste', keyPhrase: kp('season to taste') },
            { text: ' before serving.' },
        ]);
    });

    it('should match multiple non-overlapping phrases in one instruction', () => {
        const result = splitByKeyPhrases('Fold in the flour and bring to a boil.', [
            kp('fold in'),
            kp('bring to a boil'),
        ]);
        expect(result).toEqual([
            { text: 'Fold in', keyPhrase: kp('fold in') },
            { text: ' the flour and ' },
            { text: 'bring to a boil', keyPhrase: kp('bring to a boil') },
            { text: '.' },
        ]);
    });

    it('should match phrase at beginning of instruction', () => {
        const result = splitByKeyPhrases('Fold in the cheese.', [kp('fold in')]);
        expect(result).toEqual([
            { text: 'Fold in', keyPhrase: kp('fold in') },
            { text: ' the cheese.' },
        ]);
    });

    it('should match phrase at end of instruction', () => {
        const result = splitByKeyPhrases('Now bring to a boil', [kp('bring to a boil')]);
        expect(result).toEqual([
            { text: 'Now ' },
            { text: 'bring to a boil', keyPhrase: kp('bring to a boil') },
        ]);
    });

    it('should return single segment when no phrases match', () => {
        const result = splitByKeyPhrases('Heat the oil.', [kp('fold in')]);
        expect(result).toEqual([{ text: 'Heat the oil.' }]);
    });
});
