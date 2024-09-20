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
    if (fract.n > fract.d) {
        return `${Math.floor(fract.n / fract.d)}${fractionUnicode(fract.n % fract.d, fract.d)}`;
    }
    return fractionUnicode(fract.n, fract.d);
}

export function percentage(x: number, y: number): number {
    return 100 / (y / x);
}

export const VALID_NUMBER_REGEX =
    /^((\d+(\.\d+)?|[1-9]\d*\/[1-9]\d*)(-(\d+(\.\d+)?|[1-9]\d*\/[1-9]\d*))?)$/;
