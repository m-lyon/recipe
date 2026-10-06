import type { MeasureSummary, NamedSummary, UnitSummary, UsdaPortion } from './types.js';

/**
 * Mirrors `client/src/utils/nutrition.ts` and `client/src/features/forms/utils/portions.ts`,
 * so the CLI prices a line and maps a portion exactly as the web UI does.
 */

export interface MeasureKey {
    unit: UnitSummary;
    sizeId: string | null;
    prepMethodId: string | null;
}

export interface FoundMeasure {
    gramsPerUnit: number;
    measure: MeasureSummary;
}

function specificity(measure: MeasureSummary): number {
    return (measure.size ? 1 : 0) + (measure.prepMethod ? 1 : 0);
}

/**
 * The most specific measure that matches a recipe line:
 *  1. exact (unit, size, prep)
 *  2. drop prep (unit, size)
 *  3. drop size (unit)
 *  4. volume only: the least specific volume row, rescaled by perCanonical
 */
export function findMeasure(measures: MeasureSummary[], key: MeasureKey): FoundMeasure | null {
    const forUnit = measures.filter((m) => m.unit._id === key.unit._id);
    const sizeId = (m: MeasureSummary) => m.size?._id ?? null;
    const prepId = (m: MeasureSummary) => m.prepMethod?._id ?? null;
    const match =
        forUnit.find((m) => sizeId(m) === key.sizeId && prepId(m) === key.prepMethodId) ??
        forUnit.find((m) => sizeId(m) === key.sizeId && prepId(m) === null) ??
        forUnit.find((m) => sizeId(m) === null && prepId(m) === null);
    if (match) {
        return { gramsPerUnit: match.grams, measure: match };
    }
    if (key.unit.dimension !== 'volume') {
        return null;
    }
    const volume = measures
        .filter((m) => m.unit.dimension === 'volume')
        .sort((a, b) => specificity(a) - specificity(b))[0];
    if (!volume) {
        return null;
    }
    return {
        gramsPerUnit: (volume.grams / volume.unit.perCanonical) * key.unit.perCanonical,
        measure: volume,
    };
}

/** "1 cup of honey", "1 large onion": the thing whose weight is missing. */
export function describeOneUnit(
    unit: Pick<UnitSummary, 'longSingular' | 'hidden'>,
    ingredientName: string,
    sizeName?: string | null,
    prepMethodName?: string | null
): string {
    const unitStr = unit.hidden ? '' : `${unit.longSingular} of `;
    const sizeStr = sizeName ? `${sizeName} ` : '';
    const prepStr = prepMethodName ? `${prepMethodName} ` : '';
    return `1 ${unitStr}${sizeStr}${prepStr}${ingredientName}`;
}

/** A measure row ready to save: the weight of one of `unit`. */
export interface MeasureDraft {
    unitId: string;
    sizeId: string | null;
    prepMethodId: string | null;
    grams: number;
}

export interface PortionSuggestion {
    label: string;
    draft?: MeasureDraft;
    reason?: string;
}

const LEADING_AMOUNT = /^\s*(\d+\s+\d+\/\d+|\d+\/\d+|\d*\.\d+|\d+)\s+/;

function normalise(text: string): string {
    return text.trim().toLowerCase().replace(/\.$/, '');
}

function matchUnit(units: UnitSummary[], name: string): UnitSummary | undefined {
    const target = normalise(name);
    const names = (unit: UnitSummary) =>
        [unit.shortSingular, unit.shortPlural, unit.longSingular, unit.longPlural]
            .filter((n): n is string => Boolean(n))
            .map(normalise);
    return (
        units.find((unit) => names(unit).includes(target)) ??
        units.find((unit) => names(unit).includes(target.replace(/s$/, '')))
    );
}

/** Words that make a size a different size: "extra large" is not "large". */
const SIZE_MODIFIERS = new Set(['extra', 'very', 'super', 'x']);

function sizeWithin(sizes: NamedSummary[], text: string): NamedSummary | undefined {
    const words = normalise(text).split(/\s+/);
    return sizes.find((size) => {
        const target = normalise(size.value).split(/\s+/);
        for (let i = 0; i + target.length <= words.length; i++) {
            const matches = target.every((word, j) => words[i + j] === word);
            if (matches && !SIZE_MODIFIERS.has(words[i - 1])) return true;
        }
        return false;
    });
}

function matchNamed(options: NamedSummary[], name: string): NamedSummary | undefined {
    const target = normalise(name);
    return options.find((option) => normalise(option.value) === target);
}

function parseAmount(raw: string): number {
    const mixed = /^(\d+)\s+(\d+)\/(\d+)$/.exec(raw);
    if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
    const fraction = /^(\d+)\/(\d+)$/.exec(raw);
    if (fraction) return Number(fraction[1]) / Number(fraction[2]);
    return Number(raw);
}

/**
 * A measure row for a USDA portion: "1 large" is each + size large, and "cup, chopped"
 * is cup + prep chopped. Returns null for a weight, which perGram already prices.
 */
export function suggestFromPortion(
    portion: UsdaPortion,
    units: UnitSummary[],
    sizes: NamedSummary[],
    prepMethods: NamedSummary[]
): PortionSuggestion | null {
    if (portion.kind === 'WEIGHT') {
        return null;
    }
    const label = `${portion.description} (${Math.round(portion.gramWeight * 10) / 10} g)`;
    if (portion.kind === 'SERVING') {
        return { label, reason: 'a serving size, not one unit' };
    }
    const modifier = portion.modifier && !/^\d+$/.test(portion.modifier) ? portion.modifier : null;
    const text = modifier ?? portion.description;
    const leading = LEADING_AMOUNT.exec(text);
    const rest = leading ? text.slice(leading[0].length) : text;
    const amount = portion.amount ?? (leading ? parseAmount(leading[1]) : 1);
    if (!(amount > 0)) {
        return { label, reason: 'no amount' };
    }
    // An item's parenthetical only describes it ("medium (2-1/4" to 3-1/4" dia)"), but a
    // volume's changes what is measured ("cup (4.86 large eggs)").
    const described = portion.kind === 'ITEM' ? rest.replace(/\s*\(.*\)\s*/g, ' ').trim() : rest;
    if (described.includes('(')) {
        return { label, reason: 'qualified portion, enter it by hand' };
    }
    const [head, qualifier] = described.split(',').map((part) => part.trim());

    let unitId: string;
    let sizeId: string | null = null;
    if (portion.kind === 'VOLUME') {
        const unit = matchUnit(
            units.filter((u) => u.dimension === 'volume'),
            head
        );
        if (!unit) return { label, reason: `no matching unit "${head}"` };
        unitId = unit._id;
    } else {
        // "1 large" names a size; "1 Potato medium" names one among other words.
        const size = matchNamed(sizes, head) ?? sizeWithin(sizes, head);
        const countUnit = matchUnit(
            units.filter((u) => u.dimension === 'count'),
            head
        );
        if (size) {
            const each = units.find((u) => u.dimension === 'count' && u.hidden);
            if (!each) return { label, reason: 'no each unit' };
            unitId = each._id;
            sizeId = size._id;
        } else if (countUnit) {
            unitId = countUnit._id;
        } else {
            return { label, reason: `no matching unit or size "${head}"` };
        }
    }

    let prepMethodId: string | null = null;
    if (qualifier) {
        const prep = matchNamed(prepMethods, qualifier);
        if (!prep) return { label, reason: `no matching prep method "${qualifier}"` };
        prepMethodId = prep._id;
    }
    return { label, draft: { unitId, sizeId, prepMethodId, grams: portion.gramWeight / amount } };
}

/** Indexes measures by ingredient id. */
export function measuresByIngredient(measures: MeasureSummary[]): Map<string, MeasureSummary[]> {
    const byIngredient = new Map<string, MeasureSummary[]>();
    for (const measure of measures) {
        const key = String(measure.ingredient);
        byIngredient.set(key, [...(byIngredient.get(key) ?? []), measure]);
    }
    return byIngredient;
}

/** "each · large", "cup · chopped": a measure's key for display. */
export function describeMeasureKey(measure: MeasureSummary): string {
    return [measure.unit.longSingular, measure.size?.value, measure.prepMethod?.value]
        .filter(Boolean)
        .join(' · ');
}
