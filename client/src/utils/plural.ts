import { fraction } from 'mathjs';

import { isRange } from './number';

export function isPlural(quantity: string | null | undefined): boolean {
    if (quantity == null) {
        return false;
    }

    if (isRange(quantity)) {
        const [start, end] = quantity.split('-');
        return isPlural(start) || isPlural(end);
    }
    // Check if the quantity is a fraction in the form x/y
    const fractionRegex = /^\s*(\d+)\s*\/\s*(\d+)\s*$/;
    const fractionMatch = quantity.match(fractionRegex);

    if (fractionMatch) {
        const fract = fraction(quantity);
        return fract.n > fract.d ? true : false;
    }

    // If it's not a fraction, try parsing as a number and check if it's not 1
    const num = parseFloat(quantity);
    return num !== 1;
}
