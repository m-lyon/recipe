/**
 * Formats an integer number of minutes into a human-readable string.
 * Examples: 30 → "30 min", 60 → "1 hr", 90 → "1 hr 30 min"
 */
export function formatTime(minutes: number): string {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs === 0) return `${mins} min`;
    if (mins === 0) return `${hrs} hr`;
    return `${hrs} hr ${mins} min`;
}
