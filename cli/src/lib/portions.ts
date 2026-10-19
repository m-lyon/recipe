import type { UsdaPortion } from './types.js';
import { ambiguous, notFound } from './errors.js';
import { EMPTY, num, renderTable } from './format.js';

/**
 * The portion table, numbered from 1 so that `--portion 3` and the printed
 * index mean the same thing.
 */
export function renderPortions(portions: UsdaPortion[]): string {
    if (portions.length === 0) {
        return 'PORTIONS\n  This record carries no portion data.';
    }
    const table = renderTable(
        ['#', 'DESCRIPTION', 'KIND', 'GRAMS', 'ML', 'DENSITY', 'FLAGS'],
        portions.map((portion, index) => [
            String(index + 1),
            portion.description,
            portion.kind.toLowerCase(),
            num(portion.gramWeight),
            portion.millilitres === null || portion.millilitres === undefined
                ? EMPTY
                : num(portion.millilitres, 2),
            portion.impliedDensity === null || portion.impliedDensity === undefined
                ? EMPTY
                : num(portion.impliedDensity, 3),
            portion.ambiguous ? 'ambiguous' : '',
        ])
    );
    const storable = portions.filter(
        (portion) => portion.kind === 'ITEM' || portion.kind === 'VOLUME'
    );
    // Say plainly when there is nothing to store. Weights are priced by perGram alone.
    const footer =
        storable.length === 0
            ? 'No item or volume portions. Nothing here can be stored as a measure; look for ' +
              'a different record, or enter a measure by hand.'
            : `${storable.length} item or volume portion${storable.length === 1 ? '' : 's'}. ` +
              'Pass --portion to "nutrition link" to store one as a measure.';
    return ['PORTIONS', table, '', footer].join('\n');
}

/** Matches `--portion` against a 1-based index or a portion description. */
export function selectPortion(portions: UsdaPortion[], selector: string): UsdaPortion {
    const trimmed = selector.trim();
    if (/^\d+$/.test(trimmed)) {
        const index = Number.parseInt(trimmed, 10);
        const portion = portions[index - 1];
        if (!portion) {
            throw notFound(
                `Portion ${index} does not exist. This record has ${portions.length} portions.`
            );
        }
        return portion;
    }
    const needle = trimmed.toLowerCase();
    const exact = portions.filter((portion) => portion.description.toLowerCase() === needle);
    const matches =
        exact.length > 0
            ? exact
            : portions.filter((portion) => portion.description.toLowerCase().includes(needle));
    if (matches.length === 0) {
        throw notFound(
            `No portion matching "${selector}". Available: ` +
                portions.map((portion) => portion.description).join(', ')
        );
    }
    if (matches.length > 1) {
        throw ambiguous(
            `"${selector}" matches ${matches.length} portions. Use the index from "usda show".`,
            matches.map((portion) => portion.description)
        );
    }
    return matches[0];
}
