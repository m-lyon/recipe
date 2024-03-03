export function isEmptyArray(arr: any[] | undefined | null) {
    return !arr || arr.length === 0;
}

export function groupIntoPairs<T>(arr: T[]): { pairs: T[][]; remainder?: T } {
    const pairs: T[][] = [];
    let remainder: T | undefined;

    for (let i = 0; i < arr.length; i += 2) {
        if (i + 1 < arr.length) {
            pairs.push([arr[i], arr[i + 1]]);
        } else {
            remainder = arr[i];
        }
    }

    return { pairs, remainder };
}
