import type { UnitDimension, UnitSystem } from '../models/Unit.js';

export interface UnitMagnitude {
    dimension: UnitDimension;
    perCanonical: number;
    system: UnitSystem | null;
}

/**
 * Exact sizes of common units, in grams or millilitres. The US customary values are the
 * legal definitions, so they are terminating decimals and keep exact ratios: a cup is 48
 * teaspoons and 16 tablespoons with no rounding error.
 */
const MAGNITUDES: Array<[string[], UnitMagnitude]> = [
    [
        ['mg', 'milligram', 'milligramme'],
        { dimension: 'mass', perCanonical: 0.001, system: 'metric' },
    ],
    [['g', 'gram', 'gramme'], { dimension: 'mass', perCanonical: 1, system: 'metric' }],
    [['kg', 'kilogram', 'kilogramme'], { dimension: 'mass', perCanonical: 1000, system: 'metric' }],
    [['oz', 'ounce'], { dimension: 'mass', perCanonical: 28.349523125, system: 'us' }],
    [['lb', 'pound'], { dimension: 'mass', perCanonical: 453.59237, system: 'us' }],
    [
        ['ml', 'millilitre', 'milliliter'],
        { dimension: 'volume', perCanonical: 1, system: 'metric' },
    ],
    [
        ['cl', 'centilitre', 'centiliter'],
        { dimension: 'volume', perCanonical: 10, system: 'metric' },
    ],
    [
        ['dl', 'decilitre', 'deciliter'],
        { dimension: 'volume', perCanonical: 100, system: 'metric' },
    ],
    [['l', 'litre', 'liter'], { dimension: 'volume', perCanonical: 1000, system: 'metric' }],
    [['tsp', 'teaspoon'], { dimension: 'volume', perCanonical: 4.92892159375, system: 'us' }],
    [['tbsp', 'tablespoon'], { dimension: 'volume', perCanonical: 14.78676478125, system: 'us' }],
    [['fl oz', 'fluid ounce'], { dimension: 'volume', perCanonical: 29.5735295625, system: 'us' }],
    [['cup'], { dimension: 'volume', perCanonical: 236.5882365, system: 'us' }],
    [['pint', 'pt'], { dimension: 'volume', perCanonical: 473.176473, system: 'us' }],
    [['quart', 'qt'], { dimension: 'volume', perCanonical: 946.352946, system: 'us' }],
    [['gallon', 'gal'], { dimension: 'volume', perCanonical: 3785.411784, system: 'us' }],
];

const BY_NAME = new Map<string, UnitMagnitude>();
for (const [names, magnitude] of MAGNITUDES) {
    for (const name of names) {
        BY_NAME.set(name, magnitude);
    }
}

/**
 * The magnitude of a unit known by one of its names, or null. Used only to backfill and
 * seed data: nothing reads a unit name at runtime to decide its size.
 */
export function knownMagnitude(names: Array<string | null | undefined>): UnitMagnitude | null {
    for (const raw of names) {
        if (!raw) continue;
        const name = raw.trim().toLowerCase();
        const found = BY_NAME.get(name) ?? BY_NAME.get(name.replace(/s$/, ''));
        if (found) return found;
    }
    return null;
}
