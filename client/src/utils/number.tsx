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
