/** Parse a YYYY-MM-DD date string as a local date (avoids UTC-to-local shift). */
export function parseLocalDate(dateStr: string): Date {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
}

/** Fecha de hoy como "YYYY-MM-DD" en hora local (evita el corrimiento de toISOString(), que usa UTC). */
export function todayLocalDateString(): string {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
}

/** Formatea una fecha YYYY-MM-DD como "18 de agosto de 2026". */
export function formatFechaLarga(dateStr: string): string {
    return parseLocalDate(dateStr).toLocaleDateString('es-HN', { day: '2-digit', month: 'long', year: 'numeric' });
}
