/** Printed where a value is absent. */
export const EMPTY = '—';

export interface JsonEnvelope<T> {
    ok: true;
    data: T;
    warnings: string[];
}

/** Every command returns this in --json mode. */
export function envelope<T>(data: T, warnings: string[] = []): JsonEnvelope<T> {
    return { ok: true, data, warnings };
}

/** Renders a fixed-width table. The last column is never padded. */
export function renderTable(headers: string[], rows: string[][]): string {
    const widths = headers.map((header, index) =>
        Math.max(header.length, ...rows.map((row) => (row[index] ?? '').length))
    );
    const line = (cells: string[]) =>
        cells
            .map((cell, index) => (index === cells.length - 1 ? cell : cell.padEnd(widths[index])))
            .join('  ')
            .trimEnd();
    return [line(headers), ...rows.map((row) => line(row))].join('\n');
}

/** Indents every line of a block by `spaces`. */
export function indent(block: string, spaces = 2): string {
    const pad = ' '.repeat(spaces);
    return block
        .split('\n')
        .map((line) => (line.length > 0 ? pad + line : line))
        .join('\n');
}

/** A number for display, or the empty marker. */
export function num(value: number | null | undefined, decimals = 1): string {
    if (value === null || value === undefined || Number.isNaN(value)) return EMPTY;
    return value.toFixed(decimals);
}

export function text(value: string | null | undefined): string {
    return value === null || value === undefined || value === '' ? EMPTY : value;
}

export function percent(part: number, total: number): string {
    if (total === 0) return '0%';
    return `${Math.round((part / total) * 100)}%`;
}
