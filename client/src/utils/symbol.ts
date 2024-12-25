import fractionUnicode from 'fraction-unicode';

export function replaceDegrees(input: string): string {
    return input.replace(/(\d+\.?\d*)\s?degrees\s(c|f)\s/gi, (_, number, unit) => {
        const symbol = unit.toUpperCase() === 'C' ? '°C' : '°F';
        return `${number}${symbol} `;
    });
}

export function replaceFractions(input: string): string {
    return input.replace(/(\d+)\/(\d+)\s/gi, (_, numer, denom) => {
        return `${fractionUnicode(Number(numer), Number(denom))} `;
    });
}

export function replaceSymbols(input: string): string {
    return replaceFractions(replaceDegrees(input));
}
