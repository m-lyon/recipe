import { fraction } from 'mathjs';
import fractionUnicode from 'fraction-unicode';

export function isFraction(input: string): boolean {
    return input.includes('/');
}

export function isRange(input: string): boolean {
    return input.includes('-');
}

export function validateRange(input: string): boolean {
    const [start, end] = input.split('-');
    if (isFraction(start) || isFraction(end)) {
        const fractStart = fraction(start);
        const fractEnd = fraction(end);
        return fractStart.n / fractStart.d < fractEnd.n / fractEnd.d;
    }
    return parseFloat(start) < parseFloat(end);
}

export function formatFraction(input: string): string {
    const fract = fraction(input);
    if (fract.d === 1) {
        return fract.n.toString();
    }
    if (fract.n > fract.d) {
        return `${Math.floor(fract.n / fract.d)}${fractionUnicode(fract.n % fract.d, fract.d)}`;
    }
    return fractionUnicode(fract.n, fract.d);
}

export function formatFloat(input: string): string {
    const num = parseFloat(input);
    const round = (num: number, precision: number): number =>
        Math.round(num / precision) * precision;
    const trailingZerosRegex = /([0-9]+(\.[0-9]+[1-9])?)(\.?0+$)/;
    switch (true) {
        case num <= 5:
            return num.toFixed(2).replace(trailingZerosRegex, '$1');
        case num <= 25:
            return num.toFixed(1).replace(trailingZerosRegex, '$1');
        case num <= 100:
            return round(num, 0.5).toFixed(1).replace(trailingZerosRegex, '$1');
        case num <= 250:
            return num.toFixed(0);
        default:
            return round(num, 5).toFixed(0);
    }
}

export function percentage(x: number, y: number): number {
    return 100 / (y / x);
}

export const VALID_NUMBER_REGEX =
    /^((\d+(\.\d+)?|[1-9]\d*\/[1-9]\d*)(-(\d+(\.\d+)?|[1-9]\d*\/[1-9]\d*))?)$/;
