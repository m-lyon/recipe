import { Fraction, divide, fraction, multiply, smallerEq } from 'mathjs';

import { GetDisplayLaddersQuery } from '@recipe/graphql/generated';

import { isFraction, isRange } from './number';
import { returnQuantityFromFraction } from './quantity';

export type DisplayLadder = GetDisplayLaddersQuery['displayLadderMany'][number];
export type UnitSystemPreference = 'as-written' | 'metric' | 'us';

/** The unit fields that conversion reads. */
export type SizedUnit = Pick<
    NonNullable<FinishedUnit>,
    '_id' | 'dimension' | 'perCanonical' | 'system' | 'preferredNumberFormat'
>;

/**
 * A stored factor as an exact rational. Factors are terminating decimals and the string
 * form of a JS number is its shortest exact decimal, so `fraction('236.5882365')` is exact
 * where `fraction(236.5882365)` would approximate.
 */
export function exactFactor(value: number): Fraction {
    return fraction(String(value)) as Fraction;
}

function parseQuantity(quantity: string): Fraction {
    return (isFraction(quantity) ? fraction(quantity) : fraction(quantity.trim())) as Fraction;
}

function toNumber(value: Fraction): number {
    return value.n / value.d;
}

/**
 * The ladder for a dimension and system. A reader's own ladder wins over a global one, as
 * the API only returns a reader's own ladders and the global ones.
 */
export function findLadder(
    ladders: DisplayLadder[],
    dimension: string,
    system: string | null
): DisplayLadder | undefined {
    const matching = ladders.filter(
        (ladder) => ladder.dimension === dimension && ladder.system === system
    );
    return matching.find((ladder) => ladder.scope === 'user') ?? matching[0];
}

function stepsDescending(ladder: DisplayLadder) {
    return [...ladder.steps].sort((a, b) => b.minCanonical - a.minCanonical);
}

interface LadderedQuantity<U> {
    quantity: Fraction;
    unit: U;
}

/**
 * Shows a quantity in the largest step of its ladder that it reaches: 750 g stays 750 g and
 * 1500 g becomes 1.5 kg. Arithmetic stays rational, so 1/3 cup round-trips exactly.
 */
export function ladderQuantity<U extends SizedUnit>(
    quantity: Fraction,
    unit: U,
    ladder: DisplayLadder | undefined
): LadderedQuantity<U | DisplayLadder['steps'][number]['unit']> {
    if (!ladder) {
        return { quantity, unit };
    }
    const canonical = multiply(quantity, exactFactor(unit.perCanonical)) as Fraction;
    for (const step of stepsDescending(ladder)) {
        if (smallerEq(exactFactor(step.minCanonical), canonical)) {
            const converted = divide(canonical, exactFactor(step.unit.perCanonical)) as Fraction;
            return { quantity: converted, unit: step.unit };
        }
    }
    return { quantity, unit };
}

/** Applies a function to each end of a range quantity, or to a single quantity. */
export function mapQuantity(
    quantity: string,
    fn: (part: string) => { quantity: string; unit: FinishedUnit }
): { quantity: string; unit: FinishedUnit } {
    if (isRange(quantity)) {
        const [start, end] = quantity.split('-');
        const first = fn(start);
        const second = fn(end);
        return { quantity: `${first.quantity}-${second.quantity}`, unit: first.unit };
    }
    return fn(quantity);
}

/** Ladders a quantity string within its unit's own system. */
export function applyLadder(
    quantity: string,
    unit: NonNullable<FinishedUnit>,
    ladders: DisplayLadder[]
): { quantity: string; unit: FinishedUnit } {
    if (unit.dimension === 'count') {
        return { quantity, unit };
    }
    const ladder = findLadder(ladders, unit.dimension, unit.system);
    // A range keeps one unit: both ends are laddered from the start's step.
    const start = isRange(quantity) ? quantity.split('-')[0] : quantity;
    const target = ladderQuantity(parseQuantity(start), unit, ladder).unit;
    return mapQuantity(quantity, (part) => {
        const canonical = multiply(parseQuantity(part), exactFactor(unit.perCanonical));
        const converted = divide(canonical, exactFactor(target.perCanonical)) as Fraction;
        return { quantity: returnQuantityFromFraction(converted, target), unit: target };
    });
}

const KITCHEN_FRACTIONS: Array<[number, number]> = [
    [0, 1],
    [1, 8],
    [1, 4],
    [1, 3],
    [1, 2],
    [2, 3],
    [3, 4],
    [1, 1],
];

/**
 * Rounds a converted value to something a cook writes. Fraction units snap to the nearest
 * kitchen fraction; decimal units round to 2 significant figures, never finer than one
 * gram or millilitre. Returns the rounded value as a quantity string.
 */
export function roundForUnit(value: number, unit: SizedUnit): { quantity: string; value: number } {
    if (unit.preferredNumberFormat === 'fraction') {
        const whole = Math.floor(value);
        const rest = value - whole;
        let best = KITCHEN_FRACTIONS[0];
        for (const candidate of KITCHEN_FRACTIONS) {
            if (Math.abs(candidate[0] / candidate[1] - rest) < Math.abs(best[0] / best[1] - rest)) {
                best = candidate;
            }
        }
        const rounded = fraction(whole * best[1] + best[0], best[1]) as Fraction;
        return { quantity: returnQuantityFromFraction(rounded, unit), value: toNumber(rounded) };
    }
    if (value <= 0) {
        return { quantity: '0', value: 0 };
    }
    const significant = Math.pow(10, Math.floor(Math.log10(value)) - 1);
    const step = Math.max(significant, 1 / unit.perCanonical);
    const rounded = Number((Math.round(value / step) * step).toPrecision(12));
    return { quantity: String(rounded), value: rounded };
}

/** A converted value within this fraction of the exact value is close enough to show. */
const ROUNDING_TOLERANCE = 0.1;

/**
 * Converts one quantity into another system's ladder, rounded for display. The largest
 * step that the quantity reaches and whose rounded value is within 10% of the exact value
 * wins. When no step rounds well, the smallest step shows the value to 2 significant figures.
 */
function convertPart(
    quantity: string,
    unit: NonNullable<FinishedUnit>,
    ladder: DisplayLadder
): { quantity: string; unit: FinishedUnit } {
    const canonical = toNumber(
        multiply(parseQuantity(quantity), exactFactor(unit.perCanonical)) as Fraction
    );
    const steps = stepsDescending(ladder);
    const reached = steps.filter((step) => step.minCanonical <= canonical);
    const candidates = reached.length ? reached : steps.slice(-1);
    for (const step of candidates) {
        const exact = canonical / step.unit.perCanonical;
        const rounded = roundForUnit(exact, step.unit);
        if (rounded.value > 0 && Math.abs(rounded.value - exact) / exact <= ROUNDING_TOLERANCE) {
            return { quantity: rounded.quantity, unit: step.unit };
        }
    }
    const smallest = candidates[candidates.length - 1].unit;
    const exact = canonical / smallest.perCanonical;
    return { quantity: String(Number(exact.toPrecision(2))), unit: smallest };
}

export interface SystemConversion {
    quantity: string;
    unit: FinishedUnit;
    /** True when the value was converted from the authored system and rounded. */
    approximate: boolean;
}

/**
 * Shows a quantity in the reader's chosen system. Count units, units already in that
 * system, and systems with no ladder for the dimension stay as authored.
 */
export function convertToSystem(
    quantity: string,
    unit: FinishedUnit,
    preference: UnitSystemPreference,
    ladders: DisplayLadder[]
): SystemConversion {
    const unchanged = { quantity, unit, approximate: false };
    if (preference === 'as-written' || unit == null || unit.dimension === 'count') {
        return unchanged;
    }
    if (unit.system === preference) {
        return unchanged;
    }
    const ladder = findLadder(ladders, unit.dimension, preference);
    if (!ladder) {
        return unchanged;
    }
    if (isRange(quantity)) {
        const [start, end] = quantity.split('-');
        const first = convertPart(start, unit, ladder);
        const canonicalEnd = multiply(parseQuantity(end), exactFactor(unit.perCanonical));
        const endUnit = first.unit!;
        const exactEnd = toNumber(
            divide(canonicalEnd, exactFactor(endUnit.perCanonical)) as Fraction
        );
        const second = roundForUnit(exactEnd, endUnit);
        return {
            quantity: `${first.quantity}-${second.quantity}`,
            unit: endUnit,
            approximate: true,
        };
    }
    return { ...convertPart(quantity, unit, ladder), approximate: true };
}
