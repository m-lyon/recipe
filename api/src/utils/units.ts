import type { UnitDimension, UnitSystem } from '../models/Unit.js';

export interface UnitMagnitude {
    dimension: UnitDimension;
    perCanonical: number;
    system: UnitSystem | null;
}

export interface StandardUnit extends UnitMagnitude {
    /** Stored on the unit as `standard`, so code can find it without reading a name. */
    key: string;
    shortSingular: string;
    shortPlural: string;
    longSingular: string;
    longPlural: string;
    preferredNumberFormat: 'decimal' | 'fraction';
    hasSpace: boolean;
    hidden: boolean;
    /** Other spellings, matched when an existing unit is adopted as this standard unit. */
    aliases: string[];
    /**
     * Created when the database has no matching unit. A unit with more than one common
     * definition (a US or an imperial pint) is only sized when a matching unit exists.
     */
    core: boolean;
}

type Definition = Omit<StandardUnit, 'hidden' | 'aliases' | 'core'> &
    Partial<Pick<StandardUnit, 'hidden' | 'aliases' | 'core'>>;

function metric(definition: Omit<Definition, 'system' | 'preferredNumberFormat'>): StandardUnit {
    return {
        system: 'metric',
        preferredNumberFormat: 'decimal',
        hidden: false,
        aliases: [],
        core: true,
        ...definition,
    };
}

function us(definition: Omit<Definition, 'system' | 'preferredNumberFormat'>): StandardUnit {
    return {
        system: 'us',
        preferredNumberFormat: 'fraction',
        hidden: false,
        aliases: [],
        core: true,
        ...definition,
    };
}

/**
 * The units whose size is a fact, defined here and not in the database. Their `dimension`,
 * `perCanonical`, `system` and `hidden` fields cannot be changed through the API, and they
 * cannot be deleted. How they are written (names, number format, spacing) stays editable.
 *
 * The US customary values are the legal definitions, so they are terminating decimals and
 * keep exact ratios: a cup is 48 teaspoons and 16 tablespoons with no rounding error.
 */
export const STANDARD_UNITS: StandardUnit[] = [
    metric({
        key: 'milligram',
        shortSingular: 'mg',
        shortPlural: 'mg',
        longSingular: 'milligram',
        longPlural: 'milligrams',
        dimension: 'mass',
        perCanonical: 0.001,
        hasSpace: false,
        aliases: ['milligramme'],
        core: false,
    }),
    metric({
        key: 'gram',
        shortSingular: 'g',
        shortPlural: 'g',
        longSingular: 'gram',
        longPlural: 'grams',
        dimension: 'mass',
        perCanonical: 1,
        hasSpace: false,
        aliases: ['gramme'],
    }),
    metric({
        key: 'kilogram',
        shortSingular: 'kg',
        shortPlural: 'kg',
        longSingular: 'kilogram',
        longPlural: 'kilograms',
        dimension: 'mass',
        perCanonical: 1000,
        hasSpace: true,
        aliases: ['kilogramme'],
    }),
    us({
        key: 'ounce',
        shortSingular: 'oz',
        shortPlural: 'oz',
        longSingular: 'ounce',
        longPlural: 'ounces',
        dimension: 'mass',
        perCanonical: 28.349523125,
        hasSpace: true,
    }),
    us({
        key: 'pound',
        shortSingular: 'lb',
        shortPlural: 'lb',
        longSingular: 'pound',
        longPlural: 'pounds',
        dimension: 'mass',
        perCanonical: 453.59237,
        hasSpace: true,
        aliases: ['lbs'],
    }),
    metric({
        key: 'millilitre',
        shortSingular: 'ml',
        shortPlural: 'ml',
        longSingular: 'millilitre',
        longPlural: 'millilitres',
        dimension: 'volume',
        perCanonical: 1,
        hasSpace: true,
        aliases: ['milliliter'],
    }),
    metric({
        key: 'centilitre',
        shortSingular: 'cl',
        shortPlural: 'cl',
        longSingular: 'centilitre',
        longPlural: 'centilitres',
        dimension: 'volume',
        perCanonical: 10,
        hasSpace: true,
        aliases: ['centiliter'],
        core: false,
    }),
    metric({
        key: 'decilitre',
        shortSingular: 'dl',
        shortPlural: 'dl',
        longSingular: 'decilitre',
        longPlural: 'decilitres',
        dimension: 'volume',
        perCanonical: 100,
        hasSpace: true,
        aliases: ['deciliter'],
        core: false,
    }),
    metric({
        key: 'litre',
        shortSingular: 'l',
        shortPlural: 'l',
        longSingular: 'litre',
        longPlural: 'litres',
        dimension: 'volume',
        perCanonical: 1000,
        hasSpace: true,
        aliases: ['liter'],
    }),
    us({
        key: 'teaspoon',
        shortSingular: 'tsp',
        shortPlural: 'tsp',
        longSingular: 'teaspoon',
        longPlural: 'teaspoons',
        dimension: 'volume',
        perCanonical: 4.92892159375,
        hasSpace: true,
    }),
    us({
        key: 'tablespoon',
        shortSingular: 'tbsp',
        shortPlural: 'tbsp',
        longSingular: 'tablespoon',
        longPlural: 'tablespoons',
        dimension: 'volume',
        perCanonical: 14.78676478125,
        hasSpace: true,
    }),
    us({
        key: 'fluid-ounce',
        shortSingular: 'fl oz',
        shortPlural: 'fl oz',
        longSingular: 'fluid ounce',
        longPlural: 'fluid ounces',
        dimension: 'volume',
        perCanonical: 29.5735295625,
        hasSpace: true,
        core: false,
    }),
    us({
        key: 'cup',
        shortSingular: 'cup',
        shortPlural: 'cups',
        longSingular: 'cup',
        longPlural: 'cups',
        dimension: 'volume',
        perCanonical: 236.5882365,
        hasSpace: true,
    }),
    us({
        key: 'pint',
        shortSingular: 'pt',
        shortPlural: 'pt',
        longSingular: 'pint',
        longPlural: 'pints',
        dimension: 'volume',
        perCanonical: 473.176473,
        hasSpace: true,
        core: false,
    }),
    us({
        key: 'quart',
        shortSingular: 'qt',
        shortPlural: 'qt',
        longSingular: 'quart',
        longPlural: 'quarts',
        dimension: 'volume',
        perCanonical: 946.352946,
        hasSpace: true,
        core: false,
    }),
    us({
        key: 'gallon',
        shortSingular: 'gal',
        shortPlural: 'gal',
        longSingular: 'gallon',
        longPlural: 'gallons',
        dimension: 'volume',
        perCanonical: 3785.411784,
        hasSpace: true,
        core: false,
    }),
    {
        // A quantity with no unit is a count of this: "2 onions" is 2 each.
        key: 'each',
        shortSingular: 'ea',
        shortPlural: 'ea',
        longSingular: 'each',
        longPlural: 'each',
        preferredNumberFormat: 'fraction',
        hasSpace: true,
        dimension: 'count',
        perCanonical: 1,
        system: null,
        hidden: true,
        aliases: [],
        core: true,
    },
];

export const STANDARD_UNIT_KEYS = STANDARD_UNITS.map((unit) => unit.key);
export const EACH_KEY = 'each';

/** Every name a standard unit answers to, lower case. */
export function standardUnitNames(unit: StandardUnit): string[] {
    return [
        unit.shortSingular,
        unit.shortPlural,
        unit.longSingular,
        unit.longPlural,
        ...unit.aliases,
    ].map((name) => name.toLowerCase());
}

const BY_NAME = new Map<string, StandardUnit>();
for (const unit of STANDARD_UNITS) {
    for (const name of standardUnitNames(unit)) {
        BY_NAME.set(name, unit);
    }
}

/** The standard unit known by one of these names, or null. */
export function findStandardUnit(names: Array<string | null | undefined>): StandardUnit | null {
    for (const raw of names) {
        if (!raw) continue;
        const name = raw.trim().toLowerCase();
        const found = BY_NAME.get(name) ?? BY_NAME.get(name.replace(/s$/, ''));
        if (found) return found;
    }
    return null;
}

/**
 * The magnitude of a unit known by one of its names, or null. Used only to backfill and
 * seed data: nothing reads a unit name at runtime to decide its size.
 */
export function knownMagnitude(names: Array<string | null | undefined>): UnitMagnitude | null {
    const found = findStandardUnit(names);
    if (!found || found.dimension === 'count') return null;
    return { dimension: found.dimension, perCanonical: found.perCanonical, system: found.system };
}
