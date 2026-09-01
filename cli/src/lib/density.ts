import { round } from './macros.js';
import { rejected } from './errors.js';
import type { UsdaPortion } from './types.js';

export interface DensityChoice {
    density: number;
    portion: UsdaPortion;
    /** Volume portions whose implied densities disagree are worth reporting. */
    spread: number;
}

/**
 * Picks the portion a density is derived from.
 *
 * Only a VOLUME portion carries volume information, so an item portion never
 * supplies one. Ambiguous labels such as "cup, chopped" describe a packing
 * density rather than a true density, so they need an explicit override.
 */
export function chooseDensity(portions: UsdaPortion[], allowAmbiguous: boolean): DensityChoice {
    const candidates = portions.filter(
        (portion) => typeof portion.impliedDensity === 'number' && portion.impliedDensity > 0
    );
    if (candidates.length === 0) {
        throw rejected(
            'This record has no volume portion, so no density can be derived from it. ' +
                'Set Ingredient.density by hand, or link a record that has one.'
        );
    }
    const clean = candidates.filter((portion) => !portion.ambiguous);
    const usable = clean.length > 0 ? clean : candidates;
    if (clean.length === 0 && !allowAmbiguous) {
        throw rejected(
            `The only density candidate is "${candidates[0].description}", which is ambiguous ` +
                '(it describes a packing density, not a true density). Pass ' +
                '--allow-ambiguous-density to use it anyway.',
            { candidates }
        );
    }
    // Prefer the largest volume: a cup is measured with less rounding error than
    // a teaspoon, and the two should agree anyway.
    const ranked = [...usable].sort((a, b) => (b.millilitres ?? 0) - (a.millilitres ?? 0));
    const densities = usable.map((portion) => portion.impliedDensity as number);
    const min = Math.min(...densities);
    const max = Math.max(...densities);
    return {
        // Ingredient.density is g/ml and is read by people; four decimals is
        // well beyond what the portion gram weights justify.
        density: round(ranked[0].impliedDensity as number, 4),
        portion: ranked[0],
        spread: min === 0 ? 0 : (max - min) / min,
    };
}
