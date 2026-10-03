import type { UsdaPortion } from './types.js';
import { EMPTY, num, renderTable } from './format.js';
import { ambiguous, notFound, rejected } from './errors.js';

/** Only ITEM portions describe one whole countable thing. */
export function itemPortions(portions: UsdaPortion[]): UsdaPortion[] {
    return portions.filter((portion) => portion.kind === 'ITEM');
}

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
    const items = itemPortions(portions);
    // Say plainly when there is nothing to derive perUnit from. Roughly a third
    // of foods have no item portion at all.
    const footer =
        items.length === 0
            ? 'No item portions. This record cannot supply --portion; look for a different ' +
              'record, or enter perUnit by hand.'
            : `${items.length} item portion${items.length === 1 ? '' : 's'}. ` +
              'Only item portions can supply --portion.';
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

/**
 * Refuses any portion that is not an item.
 *
 * A VOLUME portion such as "cup (4.86 large eggs)" overstates one egg roughly
 * fivefold, and a SERVING portion such as garlic's 85 g RACC by more than an
 * order of magnitude.
 */
export function assertItemPortion(portion: UsdaPortion): void {
    if (portion.kind !== 'ITEM') {
        throw rejected(
            `Portion "${portion.description}" is of kind ${portion.kind.toLowerCase()}, not item. ` +
                'Only an item portion describes one whole thing, so only an item portion can ' +
                'supply perUnit.',
            { portion }
        );
    }
}
