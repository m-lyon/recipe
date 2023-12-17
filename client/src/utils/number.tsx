import { fraction } from 'mathjs';
import fractionUnicode from 'fraction-unicode';

export function isFraction(input: string): boolean {
    return input.includes('/');
}

export function formatFraction(input: string): string {
    const fract = fraction(input);
    return fractionUnicode(fract.n, fract.d);
}

export function strToNumber(input: string): number {
    const parts = input.split('/');

    if (parts.length === 2) {
        const numerator = parseFloat(parts[0]);
        const denominator = parseFloat(parts[1]);

        if (!isNaN(numerator) && !isNaN(denominator) && denominator !== 0) {
            console.log(numerator / denominator);
            return numerator / denominator;
        }
    }

    return parseFloat(input); // If it's not a fraction, attempt to parse as a number
}
