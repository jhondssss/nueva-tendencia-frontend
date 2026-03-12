import { ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';

// ─── Types ────────────────────────────────────────────────────────────────────

export const PAGE_SIZES = [10, 25, 50, 100] as const;
export type PageSize = typeof PAGE_SIZES[number];

interface Props {
    page:             number;
    totalPages:       number;
    total:            number;
    pageSize:         PageSize;
    onPageChange:     (p: number) => void;
    onPageSizeChange: (s: PageSize) => void;
    /** Singular/plural label, e.g. "movimientos" */
    noun?:            string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildPages(page: number, total: number): (number | '…')[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

    const pages: (number | '…')[] = [1];
    if (page > 3) pages.push('…');
    for (let i = Math.max(2, page - 1); i <= Math.min(total - 1, page + 1); i++) {
        pages.push(i);
    }
    if (page < total - 2) pages.push('…');
    pages.push(total);
    return pages;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdvancedPagination({
    page, totalPages, total, pageSize,
    onPageChange, onPageSizeChange,
    noun = 'registros',
}: Props) {
    const from  = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const to    = Math.min(page * pageSize, total);
    const pages = buildPages(page, totalPages);

    const btnBase  = 'p-1 rounded hover:bg-crema-dark disabled:opacity-30 disabled:cursor-not-allowed transition-colors';
    const pageBtn  = (active: boolean) => clsx(
        'min-w-[28px] h-7 px-1 rounded text-xs font-medium transition-colors',
        active
            ? 'bg-cafe-700 text-white font-semibold'
            : 'text-cafe-600 hover:bg-crema-dark hover:text-cafe-900',
    );

    return (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 border-t border-surface-border text-xs text-cafe-500 select-none">

            {/* Resumen */}
            <span>
                {total === 0 ? (
                    `Sin ${noun}`
                ) : (
                    <>
                        Mostrando{' '}
                        <span className="font-medium text-cafe-700">{from}–{to}</span>
                        {' '}de{' '}
                        <span className="font-medium text-cafe-700">{total}</span>
                        {' '}{noun}
                    </>
                )}
            </span>

            <div className="flex items-center gap-4">

                {/* Selector de tamaño */}
                <div className="flex items-center gap-1">
                    {PAGE_SIZES.map(s => (
                        <button
                            key={s}
                            onClick={() => { onPageSizeChange(s); onPageChange(1); }}
                            className={clsx(
                                'px-2 py-0.5 rounded border text-xs transition-colors',
                                s === pageSize
                                    ? 'bg-cafe-700 text-white border-cafe-700'
                                    : 'bg-white text-cafe-500 border-surface-border hover:border-cafe-400 hover:text-cafe-700',
                            )}
                        >
                            {s}
                        </button>
                    ))}
                    <span className="text-cafe-400 pl-1">por pág.</span>
                </div>

                {/* Navegación */}
                {totalPages > 1 && (
                    <div className="flex items-center gap-0.5">

                        <button onClick={() => onPageChange(1)} disabled={page === 1}
                                aria-label="Primera página" className={btnBase}>
                            <ChevronsLeft size={14} />
                        </button>

                        <button onClick={() => onPageChange(page - 1)} disabled={page === 1}
                                aria-label="Página anterior" className={btnBase}>
                            <ChevronLeft size={14} />
                        </button>

                        {pages.map((p, i) =>
                            p === '…' ? (
                                <span key={`el-${i}`} className="w-7 text-center text-cafe-400">…</span>
                            ) : (
                                <button key={p} onClick={() => onPageChange(p as number)}
                                        className={pageBtn(p === page)}>
                                    {p}
                                </button>
                            )
                        )}

                        <button onClick={() => onPageChange(page + 1)} disabled={page === totalPages}
                                aria-label="Página siguiente" className={btnBase}>
                            <ChevronRight size={14} />
                        </button>

                        <button onClick={() => onPageChange(totalPages)} disabled={page === totalPages}
                                aria-label="Última página" className={btnBase}>
                            <ChevronsRight size={14} />
                        </button>

                    </div>
                )}
            </div>
        </div>
    );
}
