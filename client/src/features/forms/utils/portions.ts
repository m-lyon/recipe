import { UsdaPortion } from '../components/UsdaLinkSection';

type UnitOption = Pick<
    UnitChoice,
    '_id' | 'shortSingular' | 'shortPlural' | 'longSingular' | 'longPlural' | 'dimension' | 'hidden'
>;
interface NamedOption {
    _id: string;
    value: string;
}

/** A measure row ready to save: the weight of one of `unit`. */
export interface MeasureDraft {
    unitId: string;
    sizeId: string | null;
    prepMethodId: string | null;
    grams: number;
}

export interface PortionSuggestion {
    /** e.g. "1 large (150 g)" */
    label: string;
    /** Present when every part of the portion matched a unit, size or prep method. */
    draft?: MeasureDraft;
    /** Why the portion cannot become a row, shown on its chip. */
    reason?: string;
}

const LEADING_AMOUNT = /^\s*(\d+\s+\d+\/\d+|\d+\/\d+|\d*\.\d+|\d+)\s+/;

function normalise(text: string): string {
    return text.trim().toLowerCase().replace(/\.$/, '');
}

function matchUnit(units: UnitOption[], name: string): UnitOption | undefined {
    const target = normalise(name);
    const names = (unit: UnitOption) =>
        [unit.shortSingular, unit.shortPlural, unit.longSingular, unit.longPlural].map(normalise);
    return (
        units.find((unit) => names(unit).includes(target)) ??
        units.find((unit) => names(unit).includes(target.replace(/s$/, '')))
    );
}

/** Words that make a size a different size: "extra large" is not "large". */
const SIZE_MODIFIERS = new Set(['extra', 'very', 'super', 'x']);

function sizeWithin(sizes: NamedOption[], text: string): NamedOption | undefined {
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

function matchNamed(options: NamedOption[], name: string): NamedOption | undefined {
    const target = normalise(name);
    return options.find((option) => normalise(option.value) === target);
}

function formatGrams(grams: number): string {
    return String(Math.round(grams * 10) / 10);
}

/**
 * Suggests a measure row for a USDA portion: "1 large" is each + size large, and
 * "cup, chopped" is cup + prep chopped. Names are matched only to suggest a row that the
 * user confirms; nothing reads a name once the row is saved.
 */
export function suggestFromPortion(
    portion: UsdaPortion,
    units: UnitOption[],
    sizes: NamedOption[],
    prepMethods: NamedOption[]
): PortionSuggestion | null {
    if (portion.kind === 'WEIGHT') {
        // Already a mass: perGram prices it with no measure.
        return null;
    }
    const label = `${portion.description} (${formatGrams(portion.gramWeight)} g)`;
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

    let unitId: string | undefined;
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
    return {
        label,
        draft: { unitId, sizeId, prepMethodId, grams: portion.gramWeight / amount },
    };
}

/** Parses "1", "1.5", "1/2" or "1 1/2". */
function parseAmount(raw: string): number {
    const mixed = /^(\d+)\s+(\d+)\/(\d+)$/.exec(raw);
    if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
    const fraction = /^(\d+)\/(\d+)$/.exec(raw);
    if (fraction) return Number(fraction[1]) / Number(fraction[2]);
    return Number(raw);
}
