import fractionUnicode from 'fraction-unicode';

/**
 * A single inline text transform: find `pattern` and rewrite each match via `replace`.
 * All rules are composed by {@link autoFormat}. Add a shorthand by adding a rule here
 * (or, for a plain accented word, an entry in {@link accentedWords}).
 */
export type ReplacementRule = {
    pattern: RegExp;
    replace: (match: string, ...groups: string[]) => string;
};

/** `350 degrees C ` / `350 degrees f.` -> `350°C ` / `350°F.` */
const degreesRule: ReplacementRule = {
    pattern: /(\d+\.?\d*)\s?degrees\s(c|f)(\s|\.)/gi,
    replace: (_, number, unit, ending) => {
        const symbol = unit.toUpperCase() === 'C' ? '°C' : '°F';
        return `${number}${symbol}${ending}`;
    },
};

/** `1/2 ` -> `½ ` */
const fractionsRule: ReplacementRule = {
    pattern: /(\d+)\/(\d+)\s/gi,
    replace: (_, numer, denom) => `${fractionUnicode(Number(numer), Number(denom))} `,
};

/**
 * Accent-stripped spelling -> correctly accented spelling. Each inflection is listed
 * explicitly (rather than derived) because the endings are irregular (`saute`+`ed` vs
 * `puree`+`d`). Homographs of common English words (`cafe`, `pate`) are deliberately
 * omitted to avoid unwanted replacements.
 */
const accentedWords: Record<string, string> = {
    saute: 'sauté',
    sauteed: 'sautéed',
    sauteing: 'sautéing',
    puree: 'purée',
    pureed: 'puréed',
    pureeing: 'puréeing',
    purees: 'purées',
    flambe: 'flambé',
    flambeed: 'flambéed',
    flambeing: 'flambéing',
    souffle: 'soufflé',
    souffles: 'soufflés',
    creme: 'crème',
    brulee: 'brûlée',
    entree: 'entrée',
    entrees: 'entrées',
    crepe: 'crêpe',
    crepes: 'crêpes',
    jalapeno: 'jalapeño',
    jalapenos: 'jalapeños',
    consomme: 'consommé',
    veloute: 'velouté',
};

/**
 * Compile a word dictionary into a single rule. A word is only replaced once it is
 * followed by whitespace or punctuation (never at end-of-string), so a word is not
 * rewritten while it is still being typed. The typed capitalisation of the first letter
 * is preserved (`Saute ` -> `Sauté `).
 */
function buildWordRule(words: Record<string, string>): ReplacementRule {
    const alternation = Object.keys(words).join('|');
    return {
        pattern: new RegExp(`\\b(${alternation})(?=[\\s.,;:!?)])`, 'gi'),
        replace: (word) => {
            const replacement = words[word.toLowerCase()];
            const isCapitalised = word[0] !== word[0].toLowerCase();
            return isCapitalised
                ? replacement[0].toUpperCase() + replacement.slice(1)
                : replacement;
        },
    };
}

const rules: ReplacementRule[] = [degreesRule, fractionsRule, buildWordRule(accentedWords)];

/** Apply every inline text transform to `input`, in order. */
export function autoFormat(input: string): string {
    return rules.reduce((acc, { pattern, replace }) => acc.replace(pattern, replace), input);
}
