import { fraction } from 'mathjs';
import fractionUnicode from 'fraction-unicode';

export function isFraction(input: string): boolean {
    return input.includes('/');
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
    /^(?:(?:\d+\.\d+)|(?:\d+)|(?:\d+\/[1-9]\d*)|(?:(?:\d+\.\d+)|(?:\d+))(?:-(?:(?:\d+\.\d+)|(?:\d+))))$/;
