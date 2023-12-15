export function isPlural(quantity: string | null): boolean {
    if (quantity === null) {
        return false;
    }

    // Check if the quantity is a fraction in the form x/y
    const fractionRegex = /^\s*(\d+)\s*\/\s*(\d+)\s*$/;
    const fractionMatch = quantity.match(fractionRegex);

    if (fractionMatch) {
        // If it's a fraction, return false (considered singular)
        return false;
    }

    // If it's not a fraction, try parsing as a number and check if it's not 1
    const num = parseFloat(quantity);
    return num !== 1;
}
