/** Parse a YYYY-MM-DD date string as a local date (avoids UTC-to-local shift). */
export function parseLocalDate(dateStr: string): Date {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
}
