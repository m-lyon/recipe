import { describe, expect, it } from 'vitest';
import { Fraction, divide, fraction, multiply } from 'mathjs';

import { mockTablespoon } from '@recipe/graphql/queries/__mocks__/unit';
import { mockLadders } from '@recipe/graphql/queries/__mocks__/displayLadder';
import { mockCup, mockGram, mockKilogram } from '@recipe/graphql/queries/__mocks__/unit';
import { mockEach, mockMilliliter, mockTeaspoon } from '@recipe/graphql/queries/__mocks__/unit';

import { applyLadder, convertToSystem, exactFactor, roundForUnit } from '../units';

describe('exactFactor', () => {
    it('keeps the rational path exact, so 1/3 cup round-trips through millilitres', () => {
        const ml = multiply(fraction('1/3'), exactFactor(mockCup.perCanonical)) as Fraction;
        const back = divide(ml, exactFactor(mockCup.perCanonical)) as Fraction;
        expect(`${back.n}/${back.d}`).toBe('1/3');
    });

    it('makes a cup exactly 48 teaspoons', () => {
        const ratio = divide(
            exactFactor(mockCup.perCanonical),
            exactFactor(mockTeaspoon.perCanonical)
        ) as Fraction;
        expect(ratio.n / ratio.d).toBe(48);
    });
});

describe('applyLadder', () => {
    it('shows a quantity in the largest step it reaches', () => {
        expect(applyLadder('1500', mockGram, mockLadders)).toEqual({
            quantity: '1.5',
            unit: mockKilogram,
        });
    });

    it('leaves a quantity below the next step alone', () => {
        expect(applyLadder('750', mockGram, mockLadders)).toEqual({
            quantity: '750',
            unit: mockGram,
        });
    });

    it('ladders US volume with exact fractions', () => {
        expect(applyLadder('12', mockTeaspoon, mockLadders)).toEqual({
            quantity: '1/4',
            unit: mockCup,
        });
        expect(applyLadder('6', mockTeaspoon, mockLadders)).toEqual({
            quantity: '2',
            unit: mockTablespoon,
        });
    });

    it('keeps both ends of a range in one unit', () => {
        expect(applyLadder('1000-1500', mockGram, mockLadders)).toEqual({
            quantity: '1-1.5',
            unit: mockKilogram,
        });
    });

    it('never ladders a count unit', () => {
        expect(applyLadder('12', mockEach, mockLadders)).toEqual({
            quantity: '12',
            unit: mockEach,
        });
    });
});

describe('roundForUnit', () => {
    it('snaps fraction units to kitchen fractions', () => {
        expect(roundForUnit(0.3, mockCup).quantity).toBe('1/3');
        expect(roundForUnit(1.7, mockCup).quantity).toBe('5/3');
    });

    it('rounds decimal units to 2 significant figures', () => {
        expect(roundForUnit(78.86, mockMilliliter).quantity).toBe('79');
        expect(roundForUnit(473.18, mockMilliliter).quantity).toBe('470');
        expect(roundForUnit(1.18, mockKilogram).quantity).toBe('1.2');
    });

    it('never rounds finer than one gram or millilitre', () => {
        expect(roundForUnit(0.4, mockGram).quantity).toBe('0');
    });
});

describe('convertToSystem', () => {
    it('leaves a recipe as written by default', () => {
        expect(convertToSystem('1/3', mockCup, 'as-written', mockLadders)).toEqual({
            quantity: '1/3',
            unit: mockCup,
            approximate: false,
        });
    });

    it('converts US volume to metric, rounded and marked approximate', () => {
        expect(convertToSystem('1/3', mockCup, 'metric', mockLadders)).toEqual({
            quantity: '79',
            unit: mockMilliliter,
            approximate: true,
        });
    });

    it('falls to a smaller unit when the larger one rounds badly', () => {
        // 100 ml is 0.42 cup: 1/2 cup is 18% off, so it shows as 6 3/4 tbsp.
        expect(convertToSystem('100', mockMilliliter, 'us', mockLadders)).toEqual({
            quantity: '27/4',
            unit: mockTablespoon,
            approximate: true,
        });
    });

    it('stays as written when the target system has no ladder for the dimension', () => {
        expect(convertToSystem('1', mockKilogram, 'us', mockLadders).approximate).toBe(false);
    });

    it('never converts a unit already in the target system or a count unit', () => {
        expect(convertToSystem('2', mockGram, 'metric', mockLadders).approximate).toBe(false);
        expect(convertToSystem('2', mockEach, 'us', mockLadders).approximate).toBe(false);
    });
});
